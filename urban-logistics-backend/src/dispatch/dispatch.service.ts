import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { haversineKm } from '../common/utils/geo';
import { ensureDispatchLegForOrder } from './fulfillment.util';
import { BatchAssignLegsDto } from './dto/batch-assign-legs.dto';

@Injectable()
export class DispatchService {
    constructor(private readonly prisma: PrismaService) {}

    async unassignedLegs() {
        return this.prisma.leg.findMany({
            where: { assignments: { none: {} } },
            orderBy: { createdAt: 'asc' },
            include: {
                shipment: {
                    include: {
                        order: {
                            select: {
                                id: true,
                                orderNumber: true,
                                status: true,
                                pickupAddress: true,
                                deliveryAddress: true,
                                pickupPhone: true,
                                deliveryPhone: true,
                                pickupLat: true,
                                pickupLon: true,
                                deliveryLat: true,
                                deliveryLon: true,
                            },
                        },
                    },
                },
                route: { select: { id: true, name: true, mode: true, status: true } },
                stops: {
                    orderBy: { sequence: 'asc' },
                    select: {
                        id: true,
                        sequence: true,
                        type: true,
                        latitude: true,
                        longitude: true,
                        address: true,
                        status: true,
                    },
                },
            },
        });
    }

    /** Xem kết quả sau điều phối: phân công mới nhất (xe, tài xế, mã vận đơn). */
    async recentAssignments(limit = 40) {
        const take = Math.min(Math.max(Number(limit) || 40, 1), 100);
        return this.prisma.assignment.findMany({
            take,
            orderBy: { assignedAt: 'desc' },
            include: {
                vehicle: { select: { id: true, plate: true, type: true, status: true } },
                driver: { select: { id: true, name: true, phone: true } },
                leg: {
                    include: {
                        shipment: {
                            select: {
                                trackingNo: true,
                                order: { select: { orderNumber: true } },
                            },
                        },
                    },
                },
            },
        });
    }

    /** Đơn cũ chưa có shipment/leg — đẩy vào hàng đợi điều phối */
    async enqueueOrder(orderId: string) {
        return ensureDispatchLegForOrder(this.prisma, orderId);
    }

    async assign(dto: { legId: string; vehicleId: string; driverId?: string }) {
        const leg = await this.prisma.leg.findUnique({
            where: { id: dto.legId },
            include: { assignments: true },
        });
        if (!leg) throw new NotFoundException('Leg not found');
        if (leg.assignments.length > 0) {
            throw new BadRequestException('Leg đã được gán xe — hủy assignment cũ trước khi gán lại');
        }
        const vehicle = await this.prisma.vehicle.findUnique({ where: { id: dto.vehicleId } });
        if (!vehicle) throw new NotFoundException('Vehicle not found');
        if (dto.driverId) {
            const driver = await this.prisma.user.findUnique({ where: { id: dto.driverId } });
            if (!driver) throw new NotFoundException('Driver not found');
        }
        return this.prisma.assignment.create({
            data: {
                legId: dto.legId,
                vehicleId: dto.vehicleId,
                driverId: dto.driverId,
                status: 'assigned',
            },
            include: {
                vehicle: { include: { carrier: true } },
                leg: true,
                driver: { select: { id: true, name: true, phone: true } },
            },
        });
    }

    /** Gom nhiều leg lên một xe (cùng tài xế tùy chọn) */
    async batchAssign(dto: BatchAssignLegsDto) {
        const uniqueIds = [...new Set(dto.legIds)];
        return this.prisma.$transaction(async (tx) => {
            const vehicle = await tx.vehicle.findUnique({ where: { id: dto.vehicleId } });
            if (!vehicle) throw new NotFoundException('Vehicle not found');
            if (dto.driverId) {
                const driver = await tx.user.findUnique({ where: { id: dto.driverId } });
                if (!driver) throw new NotFoundException('Driver not found');
            }

            const results = [];
            for (const legId of uniqueIds) {
                const leg = await tx.leg.findUnique({
                    where: { id: legId },
                    include: { assignments: true },
                });
                if (!leg) throw new NotFoundException(`Leg ${legId} not found`);
                if (leg.assignments.length > 0) {
                    throw new BadRequestException(`Leg ${legId.slice(0, 8)}… đã được gán — bỏ khỏi lô hoặc hủy gán trước`);
                }
                const a = await tx.assignment.create({
                    data: {
                        legId,
                        vehicleId: dto.vehicleId,
                        driverId: dto.driverId,
                        status: 'assigned',
                    },
                    include: {
                        vehicle: { include: { carrier: true } },
                        leg: { include: { shipment: { select: { trackingNo: true } } } },
                        driver: { select: { id: true, name: true, phone: true } },
                    },
                });
                results.push(a);
            }
            return { count: results.length, assignments: results };
        });
    }

    /** Gợi ý xe gần điểm pickup đầu của leg (telemetry; fallback: xe available đầu tiên). */
    async suggestVehicleForLeg(legId: string) {
        const leg = await this.prisma.leg.findUnique({
            where: { id: legId },
            include: { stops: { orderBy: { sequence: 'asc' } } },
        });
        if (!leg) throw new NotFoundException('Leg not found');
        const pickup = leg.stops.find((s) => s.type === 'pickup' && s.latitude != null && s.longitude != null);
        const targetLat = pickup?.latitude ?? 21.0285;
        const targetLon = pickup?.longitude ?? 105.854;

        const vehicles = await this.prisma.vehicle.findMany({
            where: { status: 'available', isActive: true },
            take: 40,
            include: {
                telemetries: { orderBy: { timestamp: 'desc' }, take: 1 },
                carrier: true,
            },
        });

        let best: { vehicleId: string; distanceKm: number; plate: string; carrierName: string } | null = null;
        for (const v of vehicles) {
            const t = v.telemetries[0];
            if (!t) continue;
            const d = haversineKm(t.latitude, t.longitude, targetLat, targetLon);
            if (!best || d < best.distanceKm) {
                best = {
                    vehicleId: v.id,
                    distanceKm: Math.round(d * 1000) / 1000,
                    plate: v.plate,
                    carrierName: v.carrier.name,
                };
            }
        }

        if (best) {
            return { legId, targetLat, targetLon, suggestion: best, usedTelemetry: true as const };
        }

        const fallback = await this.prisma.vehicle.findFirst({
            where: { status: 'available', isActive: true },
            include: { carrier: true },
        });
        if (!fallback) {
            throw new BadRequestException('Không có xe available trong hệ thống');
        }
        return {
            legId,
            targetLat,
            targetLon,
            usedTelemetry: false as const,
            suggestion: {
                vehicleId: fallback.id,
                distanceKm: null as number | null,
                plate: fallback.plate,
                carrierName: fallback.carrier.name,
            },
            note: 'Chưa có telemetry — gợi ý xe available đầu tiên (gom đơn thủ công)',
        };
    }
}
