import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuid } from 'uuid';

/**
 * Đảm bảo mỗi đơn có ít nhất một shipment + leg + stop (pickup/delivery) để vào hàng đợi điều phối.
 */
export async function ensureDispatchLegForOrder(prisma: PrismaService, orderId: string) {
    return prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({ where: { id: orderId } });
        if (!order) throw new NotFoundException(`Order ${orderId} not found`);

        const existingShipment = await tx.shipment.findFirst({ where: { orderId } });
        if (existingShipment) {
            const leg = await tx.leg.findFirst({
                where: { shipmentId: existingShipment.id },
                orderBy: { sequence: 'asc' },
            });
            return {
                created: false,
                orderId,
                shipmentId: existingShipment.id,
                legId: leg?.id,
                trackingNo: existingShipment.trackingNo,
            };
        }

        const trackingNo = `TRK${Date.now()}${uuid().slice(0, 6).toUpperCase()}`;
        const shipment = await tx.shipment.create({
            data: {
                orderId: order.id,
                trackingNo,
                weight: 1,
                itemCount: 1,
                description: 'Shipment (nền tảng)',
                status: 'pending',
            },
        });

        let route = await tx.route.findFirst({ where: { isActive: true }, orderBy: { createdAt: 'asc' } });
        if (!route) {
            route = await tx.route.create({
                data: {
                    name: 'Tuyến nền tảng (tự tạo)',
                    mode: 'road',
                    status: 'planned',
                    isActive: true,
                },
            });
        }

        const leg = await tx.leg.create({
            data: {
                shipmentId: shipment.id,
                routeId: route.id,
                sequence: 1,
                status: 'pending',
            },
        });

        let seq = 1;
        if (order.pickupLat != null && order.pickupLon != null) {
            await tx.stop.create({
                data: {
                    legId: leg.id,
                    sequence: seq++,
                    type: 'pickup',
                    latitude: order.pickupLat,
                    longitude: order.pickupLon,
                    address: order.pickupAddress ?? undefined,
                },
            });
        }
        if (order.deliveryLat != null && order.deliveryLon != null) {
            await tx.stop.create({
                data: {
                    legId: leg.id,
                    sequence: seq,
                    type: 'delivery',
                    latitude: order.deliveryLat,
                    longitude: order.deliveryLon,
                    address: order.deliveryAddress ?? undefined,
                },
            });
        }

        return {
            created: true,
            orderId,
            shipmentId: shipment.id,
            legId: leg.id,
            trackingNo,
        };
    });
}
