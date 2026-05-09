import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const shipmentDetailInclude = {
    order: {
        select: {
            id: true,
            orderNumber: true,
            status: true,
            pickupAddress: true,
            deliveryAddress: true,
            pickupPhone: true,
            deliveryPhone: true,
            createdAt: true,
        },
    },
    legs: {
        include: {
            route: { select: { id: true, name: true, status: true } },
            stops: { orderBy: { sequence: 'asc' as const } },
            assignments: {
                include: {
                    vehicle: { select: { id: true, plate: true, type: true } },
                    driver: { select: { id: true, name: true, phone: true } },
                },
            },
        },
    },
} as const;

@Injectable()
export class TrackingService {
    constructor(private readonly prisma: PrismaService) {}

    async getByTrackingNo(trackingNo: string) {
        const shipment = await this.prisma.shipment.findUnique({
            where: { trackingNo },
            include: shipmentDetailInclude,
        });
        if (!shipment) throw new NotFoundException('Không tìm thấy mã vận đơn');
        return shipment;
    }

    /**
     * Tra cứu: mã vận đơn (khớp chính xác) → mã đơn hàng → 9 số cuối SĐT (pickup / delivery).
     */
    async search(raw?: string) {
        const q = raw?.trim();
        if (!q) {
            throw new BadRequestException('Thiếu tham số q (mã vận đơn, mã đơn hoặc SĐT)');
        }

        const byTracking = await this.prisma.shipment.findUnique({
            where: { trackingNo: q },
            include: shipmentDetailInclude,
        });
        if (byTracking) {
            return { matchType: 'trackingNo' as const, shipment: byTracking };
        }

        const byOrderNumber = await this.prisma.shipment.findMany({
            where: { order: { orderNumber: q } },
            orderBy: { createdAt: 'desc' },
            take: 15,
            include: shipmentDetailInclude,
        });
        if (byOrderNumber.length === 1) {
            return { matchType: 'orderNumber' as const, shipment: byOrderNumber[0] };
        }
        if (byOrderNumber.length > 1) {
            return {
                matchType: 'orderNumber' as const,
                multiple: true as const,
                shipments: byOrderNumber,
            };
        }

        const digits = q.replace(/\D/g, '');
        if (digits.length >= 9) {
            const tail = digits.slice(-9);
            const byPhone = await this.prisma.shipment.findMany({
                where: {
                    OR: [
                        { order: { deliveryPhone: { contains: tail, mode: 'insensitive' } } },
                        { order: { pickupPhone: { contains: tail, mode: 'insensitive' } } },
                    ],
                },
                orderBy: { createdAt: 'desc' },
                take: 15,
                include: shipmentDetailInclude,
            });
            if (byPhone.length === 1) {
                return { matchType: 'phone' as const, shipment: byPhone[0] };
            }
            if (byPhone.length > 1) {
                return {
                    matchType: 'phone' as const,
                    multiple: true as const,
                    shipments: byPhone,
                };
            }
        }

        throw new NotFoundException('Không tìm thấy vận đơn hoặc đơn hàng phù hợp');
    }
}
