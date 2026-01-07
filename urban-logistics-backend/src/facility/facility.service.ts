import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFacilityDto, UpdateFacilityDto } from './dto';

@Injectable()
export class FacilityService {
    constructor(private readonly prisma: PrismaService) { }

    async create(dto: CreateFacilityDto) {
        return this.prisma.facility.create({ data: dto, include: { organization: true, zone: true } });
    }

    async findAll(page = 1, limit = 10, organizationId?: string, kind?: string, zoneId?: string) {
        const pageNum = Number(page) || 1;
        const limitNum = Number(limit) || 10;
        const skip = (pageNum - 1) * limitNum;
        const where = { ...(organizationId && { organizationId }), ...(kind && { kind }), ...(zoneId && { zoneId }) };
        const [data, total] = await Promise.all([
            this.prisma.facility.findMany({ where, skip, take: limitNum, include: { organization: true, zone: true, _count: { select: { chargers: true, fuelPumps: true, docks: true } } }, orderBy: { createdAt: 'desc' } }),
            this.prisma.facility.count({ where }),
        ]);
        return { data, meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) } };
    }

    async findOne(id: string) {
        const f = await this.prisma.facility.findUnique({ where: { id }, include: { organization: true, zone: true, chargers: true, fuelPumps: true, docks: true } });
        if (!f) throw new NotFoundException(`Facility ${id} not found`);
        return f;
    }

    async update(id: string, dto: UpdateFacilityDto) {
        await this.findOne(id);
        return this.prisma.facility.update({ where: { id }, data: dto, include: { organization: true, zone: true } });
    }

    async remove(id: string) {
        await this.findOne(id);
        return this.prisma.facility.delete({ where: { id } });
    }
}
