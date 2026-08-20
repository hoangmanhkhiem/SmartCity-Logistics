import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { PlatformApiClient } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ZoneService } from '../zone/zone.service';
import { PartnerCreateOrderDto } from './dto/partner-create-order.dto';
import { v4 as uuid } from 'uuid';

@Injectable()
export class PartnerService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly zoneService: ZoneService,
    ) {}

    async createOrder(dto: PartnerCreateOrderDto, client: PlatformApiClient) {
        const scopes = Array.isArray(client.scopes) ? (client.scopes as string[]) : [];
        if (!scopes.includes('orders:create')) {
            throw new ForbiddenException('Missing orders:create scope');
        }
        if (!client.carrierId) {
            throw new BadRequestException('API key chưa được gán carrier');
        }

        if (dto.externalRef) {
            const existing = await this.prisma.order.findFirst({
                where: { platformApiClientId: client.id, externalRef: dto.externalRef },
            });
            if (existing) {
                return {
                    idempotent: true,
                    orderId: existing.id,
                    orderNumber: existing.orderNumber,
                    trackingNo: existing.trackingNo,
                    status: existing.status,
                };
            }
        }

        const orderNumber = `ORD-${Date.now()}-${uuid().slice(0, 6).toUpperCase()}`;
        const trackingNo = `TRK${Date.now()}${uuid().slice(0, 6).toUpperCase()}`;

        let zoneId: number | undefined;
        if (dto.deliveryLat != null && dto.deliveryLon != null) {
            zoneId = (await this.zoneService.findZoneIdForPoint(dto.deliveryLat, dto.deliveryLon)) ?? undefined;
        }

        const order = await this.prisma.order.create({
            data: {
                carrierId: client.carrierId,
                orderNumber,
                trackingNo,
                status: 'pending',
                zoneId,
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
                weightKg: dto.weightKg,
                itemCount: dto.itemCount,
                codAmount: dto.codAmount,
            },
        });

        return {
            idempotent: false,
            orderId: order.id,
            orderNumber: order.orderNumber,
            trackingNo: order.trackingNo,
            status: order.status,
        };
    }
}
