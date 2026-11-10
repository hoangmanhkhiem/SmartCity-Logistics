import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { booleanPointInPolygon, point as turfPoint } from '@turf/turf';
import { Zone, Facility, RoadSegment, Restriction } from '../../../db/entities';
import { CreateZoneDto, UpdateZoneDto } from './dto';

@Injectable()
export class ZoneService {
    constructor(
        @InjectRepository(Zone) private readonly zoneRepo: Repository<Zone>,
        @InjectRepository(Facility) private readonly facilityRepo: Repository<Facility>,
        @InjectRepository(RoadSegment) private readonly roadSegmentRepo: Repository<RoadSegment>,
        @InjectRepository(Restriction) private readonly restrictionRepo: Repository<Restriction>,
    ) {}

    async create(dto: CreateZoneDto) {
        return this.zoneRepo.save(this.zoneRepo.create(dto));
    }

    async findZoneIdForPoint(lat: number, lon: number): Promise<number | null> {
        const zones = await this.zoneRepo.find({
            where: { isActive: true, boundary: Not(IsNull()) },
            select: ['id', 'boundary'],
        });
        const pt = turfPoint([lon, lat]);
        for (const z of zones) {
            if (!z.boundary) continue;
            try {
                const geometry = JSON.parse(z.boundary);
                const polygon = geometry.type === 'Feature' ? geometry : { type: 'Feature', properties: {}, geometry };
                if (booleanPointInPolygon(pt, polygon)) return z.id;
            } catch {
                continue;
            }
        }
        return null;
    }

    async findAll(page = 1, limit = 10, type?: string) {
        const pageNum = Number(page) || 1;
        const limitNum = Number(limit) || 10;
        const skip = (pageNum - 1) * limitNum;
        const where = type ? { type } : {};
        const [raw, total] = await Promise.all([
            this.zoneRepo.find({ where, skip, take: limitNum, order: { name: 'ASC' } }),
            this.zoneRepo.count({ where }),
        ]);
        const data = await Promise.all(
            raw.map(async (z) => ({
                ...z,
                _count: {
                    facilities: await this.facilityRepo.count({ where: { zoneId: z.id } }),
                    roadSegments: await this.roadSegmentRepo.count({ where: { zoneId: z.id } }),
                    restrictions: await this.restrictionRepo.count({ where: { zoneId: z.id } }),
                },
            })),
        );
        return { data, meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) } };
    }

    async findOne(id: number) {
        const z = await this.zoneRepo.findOne({
            where: { id },
            relations: ['facilities', 'roadSegments', 'restrictions'],
        });
        if (!z) throw new NotFoundException(`Zone ${id} not found`);
        return z;
    }

    async update(id: number, dto: UpdateZoneDto) {
        await this.findOne(id);
        await this.zoneRepo.update(id, dto);
        return this.zoneRepo.findOneBy({ id });
    }

    async remove(id: number) {
        await this.findOne(id);
        return this.zoneRepo.remove(await this.zoneRepo.findOneByOrFail({ id }));
    }
}
