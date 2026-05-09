import { ForbiddenException, Injectable } from '@nestjs/common';
import { PlatformApiClient } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PartnerCreateOrderDto } from './dto/partner-create-order.dto';
import { v4 as uuid } from 'uuid';

@Injectable()
export class PartnerService {
    constructor(private readonly prisma: PrismaService) {}

    async createOrder(dto: PartnerCreateOrderDto, client: PlatformApiClient) {
        if (!client.scopes.includes('orders:create')) {
            throw new ForbiddenException('Missing orders:create scope');
        }

        if (dto.externalRef) {
            const existing = await this.prisma.order.findFirst({
                where: { platformApiClientId: client.id, externalRef: dto.externalRef },
                include: { shipments: { include: { legs: true } } },
            });
            if (existing) {
                const leg = existing.shipments[0]?.legs[0];
                return {
                    idempotent: true,
                    orderId: existing.id,
                    orderNumber: existing.orderNumber,
                    trackingNo: existing.shipments[0]?.trackingNo,
                    legId: leg?.id,
                    status: existing.status,
                };
            }
        }

        const orderNumber = `ORD-${Date.now()}-${uuid().slice(0, 6).toUpperCase()}`;

        return this.prisma.$transaction(async (tx) => {
            const order = await tx.order.create({
                data: {
                    orderNumber,
                    status: 'pending',
                    pickupAddress: dto.pickupAddress,
                    deliveryAddress: dto.deliveryAddress,
                    pickupLat: dto.pickupLat,
                    pickupLon: dto.pickupLon,
                    deliveryLat: dto.deliveryLat,
                    deliveryLon: dto.deliveryLon,
                    timeWindowStart: dto.timeWindowStart ? new Date(dto.timeWindowStart) : undefined,
                    timeWindowEnd: dto.timeWindowEnd ? new Date(dto.timeWindowEnd) : undefined,
                    pickupPhone: dto.pickupPhone,
                    deliveryPhone: dto.deliveryPhone,
                    sourceUrl: dto.sourceUrl,
                    externalRef: dto.externalRef,
                    fulfillmentChannel: dto.fulfillmentChannel ?? 'fleet',
                    platformApiClientId: client.id,
                    priority: dto.priority ?? 2,
                    notes: dto.notes,
                },
            });

            const trackingNo = `TRK${Date.now()}${uuid().slice(0, 6).toUpperCase()}`;
            const shipment = await tx.shipment.create({
                data: {
                    orderId: order.id,
                    trackingNo,
                    weight: dto.weightKg ?? 1,
                    itemCount: dto.itemCount ?? 1,
                    description: dto.itemDescription ?? 'Partner shipment',
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
                    distance: dto.estimatedDistanceKm,
                    duration: dto.estimatedDurationMin,
                    status: 'pending',
                },
            });

            let seq = 1;
            if (dto.pickupLat != null && dto.pickupLon != null) {
                await tx.stop.create({
                    data: {
                        legId: leg.id,
                        sequence: seq++,
                        type: 'pickup',
                        latitude: dto.pickupLat,
                        longitude: dto.pickupLon,
                        address: dto.pickupAddress,
                    },
                });
            }
            if (dto.deliveryLat != null && dto.deliveryLon != null) {
                await tx.stop.create({
                    data: {
                        legId: leg.id,
                        sequence: seq,
                        type: 'delivery',
                        latitude: dto.deliveryLat,
                        longitude: dto.deliveryLon,
                        address: dto.deliveryAddress,
                    },
                });
            }

            return {
                idempotent: false,
                orderId: order.id,
                orderNumber: order.orderNumber,
                trackingNo,
                legId: leg.id,
                status: order.status,
            };
        });
    }
}
