import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleDto, UpdateVehicleDto } from './dto';

@Injectable()
export class VehicleService {
    constructor(private readonly prisma: PrismaService) { }

    async create(dto: CreateVehicleDto) {
        return this.prisma.vehicle.create({ data: dto, include: { carrier: true } });
    }

    async findAll(page = 1, limit = 10, carrierId?: string, type?: string) {
        const pageNum = Number(page) || 1; const limitNum = Number(limit) || 10; const skip = (pageNum - 1) * limitNum;
        const where = { ...(carrierId && { carrierId }), ...(type && { type }) };
        const [data, total] = await Promise.all([
            this.prisma.vehicle.findMany({ where, skip, take: limitNum, include: { carrier: { include: { organization: true } } }, orderBy: { createdAt: 'desc' } }),
            this.prisma.vehicle.count({ where }),
        ]);
        return { data, meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) } };
    }

    async findOne(id: string) {
        const v = await this.prisma.vehicle.findUnique({ where: { id }, include: { carrier: { include: { organization: true } } } });
        if (!v) throw new NotFoundException(`Vehicle ${id} not found`);
        return v;
    }

    async update(id: string, dto: UpdateVehicleDto) {
        await this.findOne(id);
        return this.prisma.vehicle.update({ where: { id }, data: dto, include: { carrier: true } });
    }

    async remove(id: string) {
        await this.findOne(id);
        return this.prisma.vehicle.delete({ where: { id } });
    }
}
