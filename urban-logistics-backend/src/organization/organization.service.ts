import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrganizationDto, UpdateOrganizationDto } from './dto';

@Injectable()
export class OrganizationService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createDto: CreateOrganizationDto) {
        return this.prisma.organization.create({
            data: createDto,
        });
    }

    async findAll(page = 1, limit = 10, type?: string) {
        const pageNum = Number(page) || 1; const limitNum = Number(limit) || 10; const skip = (pageNum - 1) * limitNum;
        const where = type ? { type } : {};

        const [data, total] = await Promise.all([
            this.prisma.organization.findMany({
                where,
                skip,
                take: limitNum,
                orderBy: { createdAt: 'desc' },
                include: {
                    _count: {
                        select: { carriers: true, facilities: true },
                    },
                },
            }),
            this.prisma.organization.count({ where }),
        ]);

        return {
            data,
            meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
        };
    }

    async findOne(id: string) {
        const org = await this.prisma.organization.findUnique({
            where: { id },
            include: {
                carriers: true,
                facilities: true,
                _count: { select: { carriers: true, facilities: true, memberships: true } },
            },
        });

        if (!org) throw new NotFoundException(`Organization ${id} not found`);
        return org;
    }

    async update(id: string, updateDto: UpdateOrganizationDto) {
        await this.findOne(id);
        return this.prisma.organization.update({
            where: { id },
            data: updateDto,
        });
    }

    async remove(id: string) {
        await this.findOne(id);
        return this.prisma.organization.delete({ where: { id } });
    }
}
