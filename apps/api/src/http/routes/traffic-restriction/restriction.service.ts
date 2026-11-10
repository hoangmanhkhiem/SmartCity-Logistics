import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Restriction } from '../../../db/entities';
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

function asStringArray(value: unknown): string[] {
    return Array.isArray(value) ? (value as string[]) : [];
}

function matchesVehicleType(r: Restriction, vehicleType?: string): boolean {
    if (!vehicleType) return true;
    const list = asStringArray(r.vehicleTypes);
    const legacy = r.vehicleType;
    if (!list.length && !legacy) return true;
    if (list.length) return list.includes(vehicleType);
    return legacy === vehicleType;
}

@Injectable()
export class RestrictionService {
    constructor(@InjectRepository(Restriction) private readonly restrictionRepo: Repository<Restriction>) {}

    async create(dto: CreateRestrictionDto) {
        if (!dto.roadSegmentId && !dto.zoneId) {
            throw new BadRequestException('Cần roadSegmentId hoặc zoneId');
        }
        const saved = await this.restrictionRepo.save(
            this.restrictionRepo.create({
                roadSegmentId: dto.roadSegmentId,
                zoneId: dto.zoneId,
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
            }),
        );
        return this.restrictionRepo.findOne({
            where: { id: saved.id },
            relations: ['roadSegment', 'zone'],
        });
    }

    findAll() {
        return this.restrictionRepo.find({
            relations: ['roadSegment', 'zone'],
            order: { createdAt: 'DESC' },
        });
    }

    async findOne(id: number) {
        const r = await this.restrictionRepo.findOne({
            where: { id },
            relations: ['roadSegment', 'zone'],
        });
        if (!r) throw new NotFoundException(`Restriction ${id} not found`);
        return r;
    }

    async update(id: number, dto: UpdateRestrictionDto) {
        await this.findOne(id);
        await this.restrictionRepo.update(id, dto);
        return this.restrictionRepo.findOne({ where: { id }, relations: ['roadSegment', 'zone'] });
    }

    async remove(id: number) {
        await this.findOne(id);
        return this.restrictionRepo.remove(await this.restrictionRepo.findOneByOrFail({ id }));
    }

    async findActiveAsGeoJson(at: Date, vehicleType?: string): Promise<GeoJsonFeatureCollection> {
        const rows = await this.restrictionRepo.find({
            where: { isActive: true },
            relations: ['roadSegment', 'zone'],
        });

        const features: GeoJsonFeatureCollection['features'] = [];

        for (const r of rows) {
            if (!matchesDayOfWeek(at, asStringArray(r.daysOfWeek))) continue;
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
                    daysOfWeek: asStringArray(r.daysOfWeek),
                    vehicleTypes: asStringArray(r.vehicleTypes).length
                        ? asStringArray(r.vehicleTypes)
                        : r.vehicleType
                          ? [r.vehicleType]
                          : [],
                },
            });
        }

        return { type: 'FeatureCollection', features };
    }

    async checkVehicleAllowedInZone(
        vehicleType: string,
        zoneId: number,
        at: Date,
        weightKg?: number,
    ): Promise<Array<{ restrictionId: number; severity: string; description: string | null }>> {
        const rows = await this.restrictionRepo.find({
            where: { isActive: true, zoneId },
        });

        const violations: Array<{ restrictionId: number; severity: string; description: string | null }> = [];
        for (const r of rows) {
            if (!matchesDayOfWeek(at, asStringArray(r.daysOfWeek))) continue;
            if (!matchesTimeWindow(at, r.timeFrom, r.timeTo)) continue;
            if (!matchesVehicleType(r, vehicleType)) continue;
            if (r.maxWeight != null && weightKg != null && weightKg <= r.maxWeight) continue;
            if (r.severity === 'allowed_window') continue;

            violations.push({ restrictionId: r.id, severity: r.severity, description: r.description });
        }
        return violations;
    }
}
