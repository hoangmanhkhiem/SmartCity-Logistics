import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoadSegment } from '../../../db/entities';
import { CreateRoadSegmentDto, UpdateRoadSegmentDto } from './dto';
import { normalizeGeometryJsonString } from './utils/geojson-coordinates.util';

@Injectable()
export class RoadSegmentService {
    constructor(@InjectRepository(RoadSegment) private readonly roadSegmentRepo: Repository<RoadSegment>) {}

    async create(dto: CreateRoadSegmentDto) {
        let geometry = dto.geometry;
        if (geometry) {
            const normalized = normalizeGeometryJsonString(geometry);
            if (normalized) geometry = normalized;
        }
        const saved = await this.roadSegmentRepo.save(
            this.roadSegmentRepo.create({
                zoneId: dto.zoneId,
                name: dto.name,
                geometry,
                osmId: dto.osmId,
                oneWay: dto.oneWay ?? false,
                speedLimit: dto.speedLimit,
                lanes: dto.lanes,
                roadType: dto.roadType,
                isActive: dto.isActive ?? true,
            }),
        );
        return this.roadSegmentRepo.findOne({ where: { id: saved.id }, relations: ['zone'] });
    }

    findAll(zoneId?: string, includeInactive?: boolean) {
        return this.roadSegmentRepo.find({
            where: {
                ...(zoneId && { zoneId: Number(zoneId) }),
                ...(!includeInactive && { isActive: true }),
            },
            relations: ['zone', 'restrictions'],
            order: { name: 'ASC' },
        });
    }

    async findOne(id: number) {
        const s = await this.roadSegmentRepo.findOne({
            where: { id },
            relations: ['zone', 'restrictions'],
        });
        if (!s) throw new NotFoundException(`RoadSegment ${id} not found`);
        return s;
    }

    async update(id: number, dto: UpdateRoadSegmentDto) {
        await this.findOne(id);
        let data: UpdateRoadSegmentDto = { ...dto };
        if (dto.geometry) {
            const normalized = normalizeGeometryJsonString(dto.geometry);
            if (normalized) data = { ...data, geometry: normalized };
        }
        await this.roadSegmentRepo.update(id, data);
        return this.roadSegmentRepo.findOne({ where: { id }, relations: ['zone'] });
    }

    async remove(id: number) {
        await this.findOne(id);
        return this.roadSegmentRepo.remove(await this.roadSegmentRepo.findOneByOrFail({ id }));
    }
}
