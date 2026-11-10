import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle } from '../../../db/entities';
import { CreateVehicleDto, UpdateVehicleDto } from './dto';

@Injectable()
export class VehicleService {
    constructor(@InjectRepository(Vehicle) private readonly vehicleRepo: Repository<Vehicle>) {}

    async create(dto: CreateVehicleDto) {
        const saved = await this.vehicleRepo.save(this.vehicleRepo.create(dto));
        return this.vehicleRepo.findOne({ where: { id: saved.id }, relations: ['carrier'] });
    }

    async findAll(page = 1, limit = 10, carrierId?: string, type?: string) {
        const pageNum = Number(page) || 1;
        const limitNum = Number(limit) || 10;
        const skip = (pageNum - 1) * limitNum;
        const where = {
            ...(carrierId && { carrierId: Number(carrierId) }),
            ...(type && { type }),
        };
        const [data, total] = await Promise.all([
            this.vehicleRepo.find({
                where,
                skip,
                take: limitNum,
                relations: ['carrier'],
                order: { createdAt: 'DESC' },
            }),
            this.vehicleRepo.count({ where }),
        ]);
        return {
            data: data.map((v) => ({
                ...v,
                carrier: v.carrier
                    ? { id: v.carrier.id, name: v.carrier.name, organizationId: v.carrier.organizationId }
                    : undefined,
            })),
            meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
        };
    }

    async findOne(id: number) {
        const v = await this.vehicleRepo.findOne({ where: { id }, relations: ['carrier'] });
        if (!v) throw new NotFoundException(`Vehicle ${id} not found`);
        return {
            ...v,
            carrier: v.carrier
                ? { id: v.carrier.id, name: v.carrier.name, organizationId: v.carrier.organizationId }
                : undefined,
        };
    }

    async update(id: number, dto: UpdateVehicleDto) {
        await this.findOne(id);
        await this.vehicleRepo.update(id, dto);
        return this.vehicleRepo.findOne({ where: { id }, relations: ['carrier'] });
    }

    async remove(id: number) {
        await this.findOne(id);
        return this.vehicleRepo.remove(await this.vehicleRepo.findOneByOrFail({ id }));
    }
}
