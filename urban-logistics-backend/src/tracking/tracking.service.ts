import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const orderDetailInclude = {
    stops: {
        orderBy: { sequence: 'asc' as const },
        include: {
            route: {
                include: {
                    vehicle: { select: { id: true, plate: true, type: true } },
                    shipper: { select: { id: true, name: true, phone: true } },
                },
            },
        },
    },
} as const;

@Injectable()
export class TrackingService {
    constructor(private readonly prisma: PrismaService) {}

    async getByTrackingNo(trackingNo: string) {
        const order = await this.prisma.order.findUnique({
            where: { trackingNo },
            include: orderDetailInclude,
        });
        if (!order) throw new NotFoundException('Không tìm thấy mã vận đơn');
        return order;
    }

    /**
     * Tra cứu: mã vận đơn (khớp chính xác) → mã đơn hàng → 9 số cuối SĐT (pickup / delivery).
     */
    async search(raw?: string) {
        const q = raw?.trim();
        if (!q) {
            throw new BadRequestException('Thiếu tham số q (mã vận đơn, mã đơn hoặc SĐT)');
        }

        const byTracking = await this.prisma.order.findUnique({
            where: { trackingNo: q },
            include: orderDetailInclude,
        });
        if (byTracking) {
            return { matchType: 'trackingNo' as const, order: byTracking };
        }

        const byOrderNumber = await this.prisma.order.findMany({
            where: { orderNumber: q },
            orderBy: { createdAt: 'desc' },
            take: 15,
            include: orderDetailInclude,
        });
        if (byOrderNumber.length === 1) {
            return { matchType: 'orderNumber' as const, order: byOrderNumber[0] };
        }
        if (byOrderNumber.length > 1) {
            return {
                matchType: 'orderNumber' as const,
                multiple: true as const,
                orders: byOrderNumber,
            };
        }

        const digits = q.replace(/\D/g, '');
        if (digits.length >= 9) {
            const tail = digits.slice(-9);
            const byPhone = await this.prisma.order.findMany({
                where: {
                    OR: [
                        { deliveryPhone: { contains: tail } },
                        { pickupPhone: { contains: tail } },
                    ],
                },
                orderBy: { createdAt: 'desc' },
                take: 15,
                include: orderDetailInclude,
            });
            if (byPhone.length === 1) {
                return { matchType: 'phone' as const, order: byPhone[0] };
            }
            if (byPhone.length > 1) {
                return {
                    matchType: 'phone' as const,
                    multiple: true as const,
                    orders: byPhone,
                };
            }
        }

        throw new NotFoundException('Không tìm thấy vận đơn hoặc đơn hàng phù hợp');
    }
}
