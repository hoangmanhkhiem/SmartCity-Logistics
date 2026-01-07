import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto, UpdateOrderDto } from './dto';
import { v4 as uuid } from 'uuid';

@Injectable()
export class OrderService {
    constructor(private readonly prisma: PrismaService) { }

    async create(dto: CreateOrderDto) {
        const orderNumber = `ORD-${Date.now()}-${uuid().slice(0, 4).toUpperCase()}`;
        return this.prisma.order.create({ data: { ...dto, orderNumber }, include: { customer: true, shipments: true } });
    }

    async findAll(page = 1, limit = 10, status?: string, customerId?: string) {
        const pageNum = Number(page) || 1; const limitNum = Number(limit) || 10; const skip = (pageNum - 1) * limitNum;
        const where = { ...(status && { status }), ...(customerId && { customerId }) };
        const [data, total] = await Promise.all([
            this.prisma.order.findMany({ where, skip, take: limitNum, include: { customer: true, _count: { select: { shipments: true } } }, orderBy: { createdAt: 'desc' } }),
            this.prisma.order.count({ where }),
        ]);
        return { data, meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) } };
    }

    async findOne(id: string) {
        const o = await this.prisma.order.findUnique({ where: { id }, include: { customer: true, shipments: { include: { legs: true } } } });
        if (!o) throw new NotFoundException(`Order ${id} not found`);
        return o;
    }

    async update(id: string, dto: UpdateOrderDto) { await this.findOne(id); return this.prisma.order.update({ where: { id }, data: dto, include: { customer: true } }); }

    async remove(id: string) { await this.findOne(id); return this.prisma.order.delete({ where: { id } }); }
}
