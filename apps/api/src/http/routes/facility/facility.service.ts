import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Facility } from '../../../db/entities';
import { CreateFacilityDto, UpdateFacilityDto } from './dto';

@Injectable()
export class FacilityService {
    constructor(@InjectRepository(Facility) private readonly facilityRepo: Repository<Facility>) {}

    async create(dto: CreateFacilityDto) {
        const saved = await this.facilityRepo.save(this.facilityRepo.create(dto));
        return this.facilityRepo.findOne({
            where: { id: saved.id },
            relations: ['organization', 'zone'],
        });
    }

    async findAll(page = 1, limit = 10, organizationId?: string, zoneId?: string, kind?: string) {
        const pageNum = Number(page) || 1;
        const limitNum = Number(limit) || 10;
        const skip = (pageNum - 1) * limitNum;
        const where = {
            ...(organizationId && { organizationId: Number(organizationId) }),
            ...(zoneId && { zoneId: Number(zoneId) }),
            ...(kind && { kind }),
        };
        const [data, total] = await Promise.all([
            this.facilityRepo.find({
                where,
                skip,
                take: limitNum,
                relations: ['organization', 'zone'],
                order: { createdAt: 'DESC' },
            }),
            this.facilityRepo.count({ where }),
        ]);
        return { data, meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) } };
    }

    async findOne(id: number) {
        const f = await this.facilityRepo.findOne({
            where: { id },
            relations: ['organization', 'zone', 'chargers', 'fuelPumps', 'docks'],
        });
        if (!f) throw new NotFoundException(`Facility ${id} not found`);
        return f;
    }

    async update(id: number, dto: UpdateFacilityDto) {
        await this.findOne(id);
        await this.facilityRepo.update(id, dto);
        return this.facilityRepo.findOne({ where: { id }, relations: ['organization', 'zone'] });
    }

    async remove(id: number) {
        await this.findOne(id);
        return this.facilityRepo.remove(await this.facilityRepo.findOneByOrFail({ id }));
    }
}
