import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Restriction } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRestrictionDto, UpdateRestrictionDto } from './dto';
import {
    matchesDayOfWeek,
    matchesTimeWindow,
    severityToColor,
} from './utils/restriction-time.util';
import { normalizeLineStringCoordinates } from './utils/geojson-coordinates.util';

export type GeoJsonFeatureCollection = {
    type: 'FeatureCollection';
    features: Array<{
        type: 'Feature';
        geometry: { type: 'LineString'; coordinates: number[][] };
        properties: Record<string, unknown>;
    }>;
};

function parseLineStringFromGeometryString(geometry: string | null): { type: 'LineString'; coordinates: number[][] } | null {
    if (!geometry) return null;
    try {
        const g = JSON.parse(geometry) as Record<string, unknown>;
        if (g.type === 'LineString' && Array.isArray(g.coordinates)) {
            return g as { type: 'LineString'; coordinates: number[][] };
        }
        if (g.type === 'Feature' && g.geometry && typeof g.geometry === 'object') {
            const geo = g.geometry as { type?: string; coordinates?: unknown };
            if (geo.type === 'LineString' && Array.isArray(geo.coordinates)) {
                return { type: 'LineString', coordinates: geo.coordinates as number[][] };
            }
        }
    } catch {
        return null;
    }
    return null;
}

function matchesVehicleType(r: Restriction, vehicleType?: string): boolean {
    if (!vehicleType) return true;
    const list = r.vehicleTypes ?? [];
    const legacy = r.vehicleType;
    if (!list.length && !legacy) return true;
    if (list.length) return list.includes(vehicleType);
    return legacy === vehicleType;
}

@Injectable()
export class RestrictionService {
    constructor(private readonly prisma: PrismaService) { }

    create(dto: CreateRestrictionDto) {
        if (!dto.roadSegmentId && !dto.zoneId) {
            throw new BadRequestException('Cần roadSegmentId hoặc zoneId');
        }
        const data: Prisma.RestrictionCreateInput = {
            ...(dto.roadSegmentId && { roadSegment: { connect: { id: dto.roadSegmentId } } }),
            ...(dto.zoneId && { zone: { connect: { id: dto.zoneId } } }),
            vehicleType: dto.vehicleType,
            vehicleTypes: dto.vehicleTypes ?? [],
            severity: dto.severity ?? 'restricted',
            maxWeight: dto.maxWeight,
            maxHeight: dto.maxHeight,
            timeFrom: dto.timeFrom,
            timeTo: dto.timeTo,
            daysOfWeek: dto.daysOfWeek ?? [],
            allowed: dto.allowed ?? false,
            description: dto.description,
            isActive: dto.isActive ?? true,
        };
        return this.prisma.restriction.create({
            data,
            include: { roadSegment: true, zone: true },
        });
    }

    findAll() {
        return this.prisma.restriction.findMany({
            include: { roadSegment: true, zone: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string) {
        const r = await this.prisma.restriction.findUnique({
            where: { id },
            include: { roadSegment: true, zone: true },
        });
        if (!r) throw new NotFoundException(`Restriction ${id} not found`);
        return r;
    }

    async update(id: string, dto: UpdateRestrictionDto) {
        await this.findOne(id);
        return this.prisma.restriction.update({
            where: { id },
            data: dto,
            include: { roadSegment: true, zone: true },
        });
    }

    async remove(id: string) {
        await this.findOne(id);
        return this.prisma.restriction.delete({ where: { id } });
    }

    /**
     * Các quy định đang hiệu lực tại thời điểm `at`, lọc theo loại xe (optional).
     */
    async findActiveAsGeoJson(at: Date, vehicleType?: string): Promise<GeoJsonFeatureCollection> {
        const rows = await this.prisma.restriction.findMany({
            where: { isActive: true },
            include: { roadSegment: true, zone: true },
        });

        const features: GeoJsonFeatureCollection['features'] = [];

        for (const r of rows) {
            if (!matchesDayOfWeek(at, r.daysOfWeek)) continue;
            if (!matchesTimeWindow(at, r.timeFrom, r.timeTo)) continue;
            if (!matchesVehicleType(r, vehicleType)) continue;

            const geomStr = r.roadSegment?.geometry;
            const line = parseLineStringFromGeometryString(geomStr ?? null);
            if (!line) continue;

            const severity = r.severity || 'restricted';
            const geometry = {
                type: 'LineString' as const,
                coordinates: normalizeLineStringCoordinates(line.coordinates),
            };
            features.push({
                type: 'Feature',
                geometry,
                properties: {
                    restrictionId: r.id,
                    roadSegmentId: r.roadSegmentId,
                    severity,
                    color: severityToColor(severity),
                    description: r.description,
                    timeFrom: r.timeFrom,
                    timeTo: r.timeTo,
                    daysOfWeek: r.daysOfWeek,
                    vehicleTypes: r.vehicleTypes?.length ? r.vehicleTypes : r.vehicleType ? [r.vehicleType] : [],
                },
            });
        }

        return { type: 'FeatureCollection', features };
    }
}
