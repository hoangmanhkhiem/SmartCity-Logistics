import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRouteDto, UpdateRouteDto } from './dto';

@Injectable()
export class RouteService {
    constructor(private readonly prisma: PrismaService) { }

    async create(dto: CreateRouteDto) { return this.prisma.route.create({ data: dto, include: { legs: true } }); }

    async findAll(page = 1, limit = 10, mode?: string, status?: string) {
        const pageNum = Number(page) || 1; const limitNum = Number(limit) || 10; const skip = (pageNum - 1) * limitNum;
        const where = { ...(mode && { mode }), ...(status && { status }) };
        const [data, total] = await Promise.all([
            this.prisma.route.findMany({ where, skip, take: limitNum, include: { _count: { select: { legs: true } } }, orderBy: { createdAt: 'desc' } }),
            this.prisma.route.count({ where }),
        ]);
        return { data, meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) } };
    }

    async findOne(id: string) {
        const r = await this.prisma.route.findUnique({ where: { id }, include: { legs: { include: { stops: true, assignments: { include: { vehicle: true } } } } } });
        if (!r) throw new NotFoundException(`Route ${id} not found`);
        return r;
    }

    async update(id: string, dto: UpdateRouteDto) { await this.findOne(id); return this.prisma.route.update({ where: { id }, data: dto }); }

    async remove(id: string) { await this.findOne(id); return this.prisma.route.delete({ where: { id } }); }
}
