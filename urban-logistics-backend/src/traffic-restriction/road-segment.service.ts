import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoadSegmentDto, UpdateRoadSegmentDto } from './dto';
import { normalizeGeometryJsonString } from './utils/geojson-coordinates.util';

@Injectable()
export class RoadSegmentService {
    constructor(private readonly prisma: PrismaService) { }

    create(dto: CreateRoadSegmentDto) {
        let geometry = dto.geometry;
        if (geometry) {
            const normalized = normalizeGeometryJsonString(geometry);
            if (normalized) geometry = normalized;
        }
        return this.prisma.roadSegment.create({
            data: {
                zoneId: dto.zoneId,
                name: dto.name,
                geometry,
                osmId: dto.osmId,
                oneWay: dto.oneWay ?? false,
                speedLimit: dto.speedLimit,
                lanes: dto.lanes,
                roadType: dto.roadType,
                isActive: dto.isActive ?? true,
            },
            include: { zone: true },
        });
    }

    findAll(zoneId?: string, includeInactive?: boolean) {
        return this.prisma.roadSegment.findMany({
            where: { ...(zoneId && { zoneId }), ...(!includeInactive && { isActive: true }) },
            include: { zone: true, restrictions: true },
            orderBy: { name: 'asc' },
        });
    }

    async findOne(id: string) {
        const s = await this.prisma.roadSegment.findUnique({
            where: { id },
            include: { zone: true, restrictions: true },
        });
        if (!s) throw new NotFoundException(`RoadSegment ${id} not found`);
        return s;
    }

    async update(id: string, dto: UpdateRoadSegmentDto) {
        await this.findOne(id);
        let data: UpdateRoadSegmentDto = { ...dto };
        if (dto.geometry) {
            const normalized = normalizeGeometryJsonString(dto.geometry);
            if (normalized) data = { ...data, geometry: normalized };
        }
        return this.prisma.roadSegment.update({
            where: { id },
            data,
            include: { zone: true },
        });
    }

    async remove(id: string) {
        await this.findOne(id);
        return this.prisma.roadSegment.delete({ where: { id } });
    }
}
