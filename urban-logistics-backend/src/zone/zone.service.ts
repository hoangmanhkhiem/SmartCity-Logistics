import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateZoneDto, UpdateZoneDto } from './dto';

@Injectable()
export class ZoneService {
    constructor(private readonly prisma: PrismaService) { }

    async create(dto: CreateZoneDto) { return this.prisma.zone.create({ data: dto }); }

    async findAll(page = 1, limit = 10, type?: string) {
        const pageNum = Number(page) || 1;
        const limitNum = Number(limit) || 10;
        const skip = (pageNum - 1) * limitNum;
        const where = type ? { type } : {};
        const [data, total] = await Promise.all([
            this.prisma.zone.findMany({ where, skip, take: limitNum, include: { _count: { select: { facilities: true, roadSegments: true, restrictions: true } } }, orderBy: { name: 'asc' } }),
            this.prisma.zone.count({ where }),
        ]);
        return { data, meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) } };
    }

    async findOne(id: string) {
        const z = await this.prisma.zone.findUnique({ where: { id }, include: { facilities: true, roadSegments: true, restrictions: true } });
        if (!z) throw new NotFoundException(`Zone ${id} not found`);
        return z;
    }

    async update(id: string, dto: UpdateZoneDto) { await this.findOne(id); return this.prisma.zone.update({ where: { id }, data: dto }); }

    async remove(id: string) { await this.findOne(id); return this.prisma.zone.delete({ where: { id } }); }
}
