import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RouteService } from '../route/route.service';
import { ClockInDto, CompleteStopDto, CreateShipperProfileDto, FailStopDto } from './dto/shipper.dto';

@Injectable()
export class ShippersService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly routeService: RouteService,
    ) { }

    async listShippers(carrierId?: number) {
        const shippers = await this.prisma.shipperProfile.findMany({
            where: { ...(carrierId && { carrierId }) },
            include: {
                user: { select: { id: true, name: true, email: true, phone: true, isActive: true } },
                currentVehicle: { select: { id: true, plate: true, type: true } },
                defaultZone: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        const ids = shippers.map((s) => s.userId);
        const counts = ids.length
            ? await this.prisma.route.groupBy({
                by: ['shipperId'],
                where: { shipperId: { in: ids } },
                _count: { _all: true },
            })
            : [];
        const countByShipper = Object.fromEntries(counts.map((c) => [c.shipperId, c._count._all]));
        return shippers.map((s) => ({
            ...s,
            routesTotal: countByShipper[s.userId] ?? 0,
        }));
    }

    async createProfile(dto: CreateShipperProfileDto) {
        return this.prisma.shipperProfile.create({ data: dto, include: { user: true, carrier: true } });
    }

    async shipperStats(userId: number) {
        const profile = await this.prisma.shipperProfile.findUnique({
            where: { userId },
            include: { user: true },
        });
        if (!profile) throw new NotFoundException('Shipper not found');

        const byStatus = await this.prisma.route.groupBy({
            by: ['status'],
            where: { shipperId: userId },
            _count: { _all: true },
        });

        const recent = await this.prisma.route.findMany({
            where: { shipperId: userId },
            orderBy: { shiftDate: 'desc' },
            take: 10,
            include: {
                vehicle: { select: { plate: true, type: true } },
                _count: { select: { stops: true } },
            },
        });

        return {
            shipper: { id: profile.user.id, name: profile.user.name, email: profile.user.email, phone: profile.user.phone },
            routesByStatus: Object.fromEntries(byStatus.map((b) => [b.status, b._count._all])),
            recentRoutes: recent,
        };
    }

    async clockIn(userId: number, dto: ClockInDto) {
        const profile = await this.prisma.shipperProfile.findUnique({ where: { userId } });
        if (!profile) throw new NotFoundException('Shipper profile not found');
        const vehicle = await this.prisma.vehicle.findUnique({ where: { id: dto.vehicleId } });
        if (!vehicle || vehicle.carrierId !== profile.carrierId) {
            throw new BadRequestException('Vehicle không thuộc carrier của shipper');
        }
        return this.prisma.shipperProfile.update({
            where: { userId },
            data: { status: 'on_shift', currentVehicleId: dto.vehicleId },
        });
    }

    async clockOut(userId: number) {
        const profile = await this.prisma.shipperProfile.findUnique({ where: { userId } });
        if (!profile) throw new NotFoundException('Shipper profile not found');
        return this.prisma.shipperProfile.update({
            where: { userId },
            data: { status: 'off_duty', currentVehicleId: null },
        });
    }

    // ==================== Self-service (shipper hiện tại) ====================

    async getTodayRoute(shipperId: number) {
        const now = new Date();
        const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
        const tomorrow = new Date(today);
        tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

        return this.prisma.route.findFirst({
            where: {
                shipperId,
                shiftDate: { gte: today, lt: tomorrow },
                status: { in: ['planned', 'in_progress'] },
            },
            include: {
                vehicle: true,
                stops: { orderBy: { sequence: 'asc' }, include: { order: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async getRouteForShipper(shipperId: number, routeId: number) {
        const route = await this.prisma.route.findUnique({
            where: { id: routeId },
            include: {
                vehicle: true,
                stops: { orderBy: { sequence: 'asc' }, include: { order: true } },
            },
        });
        if (!route || route.shipperId !== shipperId) throw new NotFoundException('Route not found');
        return route;
    }

    async startRoute(shipperId: number, routeId: number) {
        const route = await this.prisma.route.findUnique({ where: { id: routeId } });
        if (!route || route.shipperId !== shipperId) throw new NotFoundException('Route not found');
        if (route.status !== 'planned') throw new BadRequestException('Route đã bắt đầu hoặc đã kết thúc');
        return this.prisma.route.update({
            where: { id: routeId },
            data: { status: 'in_progress', actualStartAt: new Date() },
        });
    }

    async completeRoute(shipperId: number, routeId: number) {
        const route = await this.prisma.route.findUnique({
            where: { id: routeId },
            include: { stops: true },
        });
        if (!route || route.shipperId !== shipperId) throw new NotFoundException('Route not found');
        const unfinished = route.stops.some((s) => !['completed', 'failed', 'skipped'].includes(s.status));
        if (unfinished) throw new BadRequestException('Còn stop chưa xử lý xong');
        return this.prisma.route.update({
            where: { id: routeId },
            data: { status: 'completed', actualEndAt: new Date() },
        });
    }

    private async findOwnedStop(shipperId: number, stopId: number) {
        const stop = await this.prisma.stop.findUnique({ where: { id: stopId }, include: { route: true, order: true } });
        if (!stop || stop.route.shipperId !== shipperId) throw new NotFoundException('Stop not found');
        return stop;
    }

    async arriveStop(shipperId: number, stopId: number) {
        await this.findOwnedStop(shipperId, stopId);
        return this.prisma.stop.update({
            where: { id: stopId },
            data: { status: 'arrived', arrivedAt: new Date() },
        });
    }

    async completeStop(shipperId: number, stopId: number, dto: CompleteStopDto) {
        const stop = await this.findOwnedStop(shipperId, stopId);
        const updated = await this.prisma.stop.update({
            where: { id: stopId },
            data: {
                status: 'completed',
                completedAt: new Date(),
                podPhotoUrl: dto.podPhotoUrl,
                podSignatureUrl: dto.podSignatureUrl,
                podNote: dto.podNote,
                ...(dto.codAmountCollected != null && {
                    codAmountCollected: dto.codAmountCollected,
                    codCollected: dto.codAmountCollected >= (stop.codAmountDue ?? 0),
                    codCollectedAt: new Date(),
                }),
            },
        });

        if (stop.type === 'delivery') {
            await this.prisma.order.update({ where: { id: stop.orderId }, data: { status: 'delivered' } });
        }

        return updated;
    }

    async failStop(shipperId: number, stopId: number, dto: FailStopDto) {
        const stop = await this.findOwnedStop(shipperId, stopId);
        const updated = await this.prisma.stop.update({
            where: { id: stopId },
            data: { status: 'failed', failedReason: dto.failedReason, podNote: dto.note },
        });

        if (stop.type === 'delivery') {
            await this.prisma.order.update({ where: { id: stop.orderId }, data: { status: 'failed' } });
        }

        return updated;
    }

    /** Chỉ đường (né đoạn cấm) từ vị trí hiện tại của xe tới điểm dừng kế tiếp chưa xử lý. */
    async getDirectionsToNextStop(shipperId: number, routeId: number) {
        const route = await this.prisma.route.findUnique({
            where: { id: routeId },
            include: { stops: { orderBy: { sequence: 'asc' } }, vehicle: true },
        });
        if (!route || route.shipperId !== shipperId) throw new NotFoundException('Route not found');

        const nextStop = route.stops.find((s) => s.status === 'pending' || s.status === 'arrived');
        if (!nextStop) throw new BadRequestException('Không còn điểm dừng nào cần xử lý trong route này');

        const latestTelemetry = await this.prisma.telemetry.findFirst({
            where: { vehicleId: route.vehicleId },
            orderBy: { timestamp: 'desc' },
        });

        let originLat: number;
        let originLon: number;
        if (latestTelemetry) {
            originLat = latestTelemetry.latitude;
            originLon = latestTelemetry.longitude;
        } else {
            const prevIdx = route.stops.findIndex((s) => s.id === nextStop.id) - 1;
            const prevStop = prevIdx >= 0 ? route.stops[prevIdx] : null;
            originLat = prevStop?.latitude ?? nextStop.latitude;
            originLon = prevStop?.longitude ?? nextStop.longitude;
        }

        const directions = await this.routeService.drivingSegmentAvoidingRestrictions({
            originLat,
            originLon,
            destLat: nextStop.latitude,
            destLon: nextStop.longitude,
            restrictionVehicleType: route.vehicle.type,
        });

        return { ...directions, nextStop };
    }
}
