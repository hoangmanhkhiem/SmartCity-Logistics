import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCarrierDto, UpdateCarrierDto } from './dto';

@Injectable()
export class CarrierService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createDto: CreateCarrierDto) {
        return this.prisma.carrier.create({ data: createDto, include: { organization: true } });
    }

    async findAll(page = 1, limit = 10, organizationId?: string) {
        const pageNum = Number(page) || 1; const limitNum = Number(limit) || 10; const skip = (pageNum - 1) * limitNum;
        const where = organizationId ? { organizationId } : {};
        const [data, total] = await Promise.all([
            this.prisma.carrier.findMany({ where, skip, take: limitNum, include: { organization: true, _count: { select: { vehicles: true } } }, orderBy: { createdAt: 'desc' } }),
            this.prisma.carrier.count({ where }),
        ]);
        return { data, meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) } };
    }

    async findOne(id: string) {
        const carrier = await this.prisma.carrier.findUnique({ where: { id }, include: { organization: true, vehicles: true } });
        if (!carrier) throw new NotFoundException(`Carrier ${id} not found`);
        return carrier;
    }

    async update(id: string, updateDto: UpdateCarrierDto) {
        await this.findOne(id);
        return this.prisma.carrier.update({ where: { id }, data: updateDto, include: { organization: true } });
    }

    async remove(id: string) {
        await this.findOne(id);
        return this.prisma.carrier.delete({ where: { id } });
    }
}
