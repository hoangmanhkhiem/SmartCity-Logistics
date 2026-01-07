import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTelemetryDto } from './dto';

@Injectable()
export class TelemetryService {
    constructor(private readonly prisma: PrismaService) { }

    async create(dto: CreateTelemetryDto) {
        return this.prisma.telemetry.create({ data: dto, include: { vehicle: true } });
    }

    async findByVehicle(vehicleId: string, page = 1, limit = 100, from?: Date, to?: Date) {
        const pageNum = Number(page) || 1; const limitNum = Number(limit) || 10; const skip = (pageNum - 1) * limitNum;
        const where = {
            vehicleId,
            ...(from || to ? { timestamp: { ...(from && { gte: from }), ...(to && { lte: to }) } } : {}),
        };
        const [data, total] = await Promise.all([
            this.prisma.telemetry.findMany({ where, skip, take: limitNum, orderBy: { timestamp: 'desc' } }),
            this.prisma.telemetry.count({ where }),
        ]);
        return { data, meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) } };
    }

    async getLatest(vehicleId: string) {
        const t = await this.prisma.telemetry.findFirst({ where: { vehicleId }, orderBy: { timestamp: 'desc' }, include: { vehicle: true } });
        if (!t) throw new NotFoundException(`No telemetry for vehicle ${vehicleId}`);
        return t;
    }

    async findAll(page = 1, limit = 100) {
        const pageNum = Number(page) || 1; const limitNum = Number(limit) || 10; const skip = (pageNum - 1) * limitNum;
        const [data, total] = await Promise.all([
            this.prisma.telemetry.findMany({ skip, take: limitNum, orderBy: { timestamp: 'desc' }, include: { vehicle: true } }),
            this.prisma.telemetry.count(),
        ]);
        return { data, meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) } };
    }
}
