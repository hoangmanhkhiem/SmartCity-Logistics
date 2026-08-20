import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ZoneService } from '../zone/zone.service';
import { CreateOrderDto, UpdateOrderDto } from './dto';
import { v4 as uuid } from 'uuid';

@Injectable()
export class OrderService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly zoneService: ZoneService,
    ) { }

    async create(dto: CreateOrderDto) {
        const orderNumber = `ORD-${Date.now()}-${uuid().slice(0, 4).toUpperCase()}`;
        const trackingNo = `TRK${Date.now()}${uuid().slice(0, 6).toUpperCase()}`;

        let zoneId = dto.zoneId;
        if (!zoneId && dto.deliveryLat != null && dto.deliveryLon != null) {
            zoneId = (await this.zoneService.findZoneIdForPoint(dto.deliveryLat, dto.deliveryLon)) ?? undefined;
        }

        return this.prisma.order.create({
            data: { ...dto, zoneId, orderNumber, trackingNo, status: 'pending' },
            include: { customer: true, zone: true, carrier: true },
        });
    }

    async findAll(page = 1, limit = 10, status?: string, customerId?: string, carrierId?: string, zoneId?: string) {
        const pageNum = Number(page) || 1; const limitNum = Number(limit) || 10; const skip = (pageNum - 1) * limitNum;
        const where = {
            ...(status && { status }),
            ...(customerId && { customerId: Number(customerId) }),
            ...(carrierId && { carrierId: Number(carrierId) }),
            ...(zoneId && { zoneId: Number(zoneId) }),
        };
        const [data, total] = await Promise.all([
            this.prisma.order.findMany({ where, skip, take: limitNum, include: { customer: true, zone: true, _count: { select: { stops: true } } }, orderBy: { createdAt: 'desc' } }),
            this.prisma.order.count({ where }),
        ]);
        return { data, meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) } };
    }

    async findOne(id: number) {
        const o = await this.prisma.order.findUnique({ where: { id }, include: { customer: true, zone: true, stops: { include: { route: true } } } });
        if (!o) throw new NotFoundException(`Order ${id} not found`);
        return o;
    }

    async update(id: number, dto: UpdateOrderDto) { await this.findOne(id); return this.prisma.order.update({ where: { id }, data: dto, include: { customer: true } }); }

    async remove(id: number) { await this.findOne(id); return this.prisma.order.delete({ where: { id } }); }
}
