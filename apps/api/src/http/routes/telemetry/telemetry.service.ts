import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindOptionsWhere, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { Telemetry } from '../../../db/entities';
import { CreateTelemetryDto } from './dto';

@Injectable()
export class TelemetryService {
    constructor(@InjectRepository(Telemetry) private readonly telemetryRepo: Repository<Telemetry>) {}

    async create(dto: CreateTelemetryDto) {
        const saved = await this.telemetryRepo.save(this.telemetryRepo.create(dto));
        return this.telemetryRepo.findOne({ where: { id: saved.id }, relations: ['vehicle'] });
    }

    async findByVehicle(vehicleId: number, page = 1, limit = 100, from?: Date, to?: Date) {
        const pageNum = Number(page) || 1;
        const limitNum = Number(limit) || 10;
        const skip = (pageNum - 1) * limitNum;
        const where: FindOptionsWhere<Telemetry> = { vehicleId };
        if (from && to) where.timestamp = Between(from, to);
        else if (from) where.timestamp = MoreThanOrEqual(from);
        else if (to) where.timestamp = LessThanOrEqual(to);
        const [data, total] = await Promise.all([
            this.telemetryRepo.find({ where, skip, take: limitNum, order: { timestamp: 'DESC' } }),
            this.telemetryRepo.count({ where }),
        ]);
        return { data, meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) } };
    }

    async getLatest(vehicleId: number) {
        const t = await this.telemetryRepo.findOne({
            where: { vehicleId },
            order: { timestamp: 'DESC' },
            relations: ['vehicle'],
        });
        if (!t) throw new NotFoundException(`No telemetry for vehicle ${vehicleId}`);
        return t;
    }

    async findAll(page = 1, limit = 100) {
        const pageNum = Number(page) || 1;
        const limitNum = Number(limit) || 10;
        const skip = (pageNum - 1) * limitNum;
        const [data, total] = await Promise.all([
            this.telemetryRepo.find({ skip, take: limitNum, order: { timestamp: 'DESC' }, relations: ['vehicle'] }),
            this.telemetryRepo.count(),
        ]);
        return { data, meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) } };
    }
}
