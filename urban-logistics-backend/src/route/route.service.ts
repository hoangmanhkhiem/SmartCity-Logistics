import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { lineString, point, pointToLineDistance } from '@turf/turf';
import { PrismaService } from '../prisma/prisma.service';
import { haversineKm } from '../common/utils/geo';
import {
    getVietnamMinutesFromMidnight,
    parseHHmmToMinutes,
} from '../traffic-restriction/utils/restriction-time.util';
import { CreateRouteDto, UpdateRouteDto } from './dto';
import { StopPointDto } from './dto/optimize-stops.dto';
import { SuggestFacilitiesDto } from './dto/suggest-facilities.dto';
import { DrivingSegmentDto } from './dto/driving-segment.dto';
import { RestrictionService } from '../traffic-restriction/restriction.service';
import type { GeoJsonFeatureCollection } from '../traffic-restriction/restriction.service';

@Injectable()
export class RouteService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly config: ConfigService,
        private readonly restrictionService: RestrictionService,
    ) { }

    async create(dto: CreateRouteDto) { return this.prisma.route.create({ data: dto, include: { legs: true } }); }

    async findAll(page = 1, limit = 10, mode?: string, status?: string) {
        const pageNum = Number(page) || 1; const limitNum = Number(limit) || 10; const skip = (pageNum - 1) * limitNum;
        const where = { ...(mode && { mode }), ...(status && { status }) };
        const [data, total] = await Promise.all([
            this.prisma.route.findMany({ where, skip, take: limitNum, include: { _count: { select: { legs: true } } }, orderBy: { createdAt: 'desc' } }),
            this.prisma.route.count({ where }),
        ]);
        return { data, meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) } };
    }

    async findOne(id: string) {
        const r = await this.prisma.route.findUnique({ where: { id }, include: { legs: { include: { stops: true, assignments: { include: { vehicle: true } } } } } });
        if (!r) throw new NotFoundException(`Route ${id} not found`);
        return r;
    }

    async update(id: string, dto: UpdateRouteDto) { await this.findOne(id); return this.prisma.route.update({ where: { id }, data: dto }); }

    async remove(id: string) { await this.findOne(id); return this.prisma.route.delete({ where: { id } }); }

    /** Thứ tự điểm giao gần đúng TSP/VRP (nearest neighbor từ điểm đầu). */
    optimizeStopSequence(points: StopPointDto[]) {
        if (!points?.length) throw new BadRequestException('points required');
        if (points.length === 1) {
            return {
                algorithm: 'nearest_neighbor',
                orderedIndices: [0],
                approximateTotalKm: 0,
                orderedPoints: points,
            };
        }
        const n = points.length;
        const remaining = new Set<number>(Array.from({ length: n }, (_, i) => i));
        const orderedIndices: number[] = [0];
        remaining.delete(0);
        let current = 0;
        let totalKm = 0;
        while (remaining.size > 0) {
            let bestJ = -1;
            let bestD = Infinity;
            for (const j of remaining) {
                const d = haversineKm(points[current].lat, points[current].lon, points[j].lat, points[j].lon);
                if (d < bestD) {
                    bestD = d;
                    bestJ = j;
                }
            }
            totalKm += bestD;
            orderedIndices.push(bestJ);
            remaining.delete(bestJ);
            current = bestJ;
        }
        const orderedPoints = orderedIndices.map((i) => points[i]);
        return {
            algorithm: 'nearest_neighbor',
            orderedIndices,
            approximateTotalKm: Math.round(totalKm * 1000) / 1000,
            orderedPoints,
        };
    }

    /**
     * Một đoạn lái xe: lấy nhiều phương án Mapbox (`alternatives`) rồi chọn tuyến có ít chồng lấp nhất với đoạn cấm/hạn chế.
     */
    async drivingSegmentAvoidingRestrictions(dto: DrivingSegmentDto) {
        const token = this.requireMapboxToken();
        const at = dto.restrictionAt ? new Date(dto.restrictionAt) : new Date();
        if (dto.restrictionAt && Number.isNaN(at.getTime())) {
            throw new BadRequestException('restrictionAt không hợp lệ (ISO 8601)');
        }
        const restrictions = await this.restrictionService.findActiveAsGeoJson(at, dto.restrictionVehicleType);
        const routes = await this.fetchMapboxDrivingAlternatives(
            dto.originLon,
            dto.originLat,
            dto.destLon,
            dto.destLat,
            token,
        );
        if (!routes.length) {
            throw new BadRequestException('Không lấy được tuyến từ Mapbox');
        }
        const route = this.pickBestRouteAmongAlternatives(routes, restrictions);
        return {
            route: {
                distance: route.distance,
                duration: route.duration,
                geometry: route.geometry,
            },
            restrictionsGeoJson: restrictions,
            routingNote:
                'Trong các phương án Mapbox, chọn tuyến có điểm phạt thấp nhất khi lệch gần đoạn cấm/hạn chế (ước lượng; không thay cho cấm đường chính thức).',
        };
    }

    /** Gợi ý kho/hub gần tuyến lái xe tối ưu (Mapbox) trong buffer mét. */
    async suggestFacilitiesAlongRoute(dto: SuggestFacilitiesDto) {
        const token = this.requireMapboxToken();
        const kinds = dto.kinds?.length ? dto.kinds : ['warehouse', 'hub'];
        const bufferMeters = dto.bufferMeters ?? 1500;
        const limit = dto.limit ?? 20;
        const departureAt = dto.departureTime ? new Date(dto.departureTime) : null;
        if (dto.departureTime && departureAt && Number.isNaN(departureAt.getTime())) {
            throw new BadRequestException('departureTime không hợp lệ (ISO 8601)');
        }

        const restrictionAt = dto.restrictionAt
            ? new Date(dto.restrictionAt)
            : dto.departureTime
              ? new Date(dto.departureTime)
              : new Date();
        if (dto.restrictionAt && Number.isNaN(restrictionAt.getTime())) {
            throw new BadRequestException('restrictionAt không hợp lệ (ISO 8601)');
        }

        const restrictions = await this.restrictionService.findActiveAsGeoJson(
            restrictionAt,
            dto.restrictionVehicleType,
        );
        const routes = await this.fetchMapboxDrivingAlternatives(
            dto.originLon,
            dto.originLat,
            dto.destLon,
            dto.destLat,
            token,
        );
        const route = this.pickBestRouteAmongAlternatives(routes, restrictions);
        if (!route?.geometry?.coordinates?.length) {
            throw new BadRequestException('Không lấy được tuyến từ Mapbox');
        }

        const line = lineString(route.geometry.coordinates);
        const facilities = await this.prisma.facility.findMany({
            where: {
                isActive: true,
                kind: { in: kinds },
            },
            include: { organization: true, zone: true },
        });

        const scored: Array<{
            distanceToRouteMeters: number;
            facility: (typeof facilities)[0];
        }> = [];

        for (const f of facilities) {
            const pt = point([f.longitude, f.latitude]);
            const d = pointToLineDistance(pt, line, { units: 'meters' });
            if (d > bufferMeters) continue;
            if (departureAt && !this.isFacilityOpenAt(f.openingTime, f.closingTime, departureAt)) continue;
            scored.push({ distanceToRouteMeters: Math.round(d * 10) / 10, facility: f });
        }

        scored.sort((a, b) => a.distanceToRouteMeters - b.distanceToRouteMeters);
        const picked = scored.slice(0, limit);

        return {
            route: {
                distance: route.distance,
                duration: route.duration,
                geometry: route.geometry,
            },
            suggestions: picked.map((s) => ({
                ...s.facility,
                distanceToRouteMeters: s.distanceToRouteMeters,
            })),
            bufferMeters,
            kinds,
            restrictionsGeoJson: restrictions,
            routingNote:
                'Tuyến chọn trong phương án Mapbox có ít chồng lấp nhất với đoạn cấm/hạn chế tại restrictionAt (ước lượng).',
        };
    }

    private requireMapboxToken(): string {
        const token =
            this.config.get<string>('MAPBOX_ACCESS_TOKEN') ||
            this.config.get<string>('MAPBOX_SECRET_TOKEN') ||
            '';
        if (!token) {
            throw new BadRequestException('Thiếu MAPBOX_ACCESS_TOKEN (hoặc MAPBOX_SECRET_TOKEN) trong môi trường');
        }
        return token;
    }

    private async fetchMapboxDrivingAlternatives(
        originLon: number,
        originLat: number,
        destLon: number,
        destLat: number,
        token: string,
    ): Promise<Array<{ distance: number; duration: number; geometry: { coordinates: [number, number][] } }>> {
        const coordsStr = `${originLon},${originLat};${destLon},${destLat}`;
        const params = new URLSearchParams({
            geometries: 'geojson',
            overview: 'full',
            access_token: token,
            alternatives: 'true',
        });
        const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordsStr}?${params.toString()}`;
        const res = await fetch(url);
        if (!res.ok) {
            const text = await res.text();
            throw new BadRequestException(`Mapbox Directions lỗi: ${res.status} ${text.slice(0, 200)}`);
        }
        const data = (await res.json()) as {
            routes?: Array<{ distance: number; duration: number; geometry: { coordinates: [number, number][] } }>;
        };
        return data.routes ?? [];
    }

    /** Điểm càng gần đoạn cấm (trong ngưỡng) → phạt càng lớn. */
    private restrictionOverlapPenalty(
        routeCoords: [number, number][],
        restrictions: GeoJsonFeatureCollection,
        thresholdM = 40,
    ): number {
        const restrictLines: ReturnType<typeof lineString>[] = [];
        for (const f of restrictions.features ?? []) {
            const g = f.geometry as { type?: string; coordinates?: [number, number][] };
            if (g?.type === 'LineString' && g.coordinates?.length && g.coordinates.length >= 2) {
                try {
                    restrictLines.push(lineString(g.coordinates));
                } catch {
                    /* skip invalid */
                }
            }
        }
        if (!restrictLines.length || !routeCoords.length) return 0;

        let penalty = 0;
        const step = Math.max(1, Math.ceil(routeCoords.length / 120));
        for (let i = 0; i < routeCoords.length; i += step) {
            const pt = point(routeCoords[i]);
            for (const rl of restrictLines) {
                const d = pointToLineDistance(pt, rl, { units: 'meters' });
                if (d < thresholdM) {
                    penalty += thresholdM - d;
                }
            }
        }
        return penalty;
    }

    private pickBestRouteAmongAlternatives(
        routes: Array<{ distance: number; duration: number; geometry: { coordinates: [number, number][] } }>,
        restrictions: GeoJsonFeatureCollection,
    ): (typeof routes)[0] {
        if (!routes.length) {
            throw new BadRequestException('Không có tuyến từ Mapbox');
        }
        if (!restrictions.features?.length) {
            return routes[0];
        }

        const scored = routes.map((r, idx) => ({
            r,
            idx,
            pen: this.restrictionOverlapPenalty(r.geometry.coordinates, restrictions),
        }));
        scored.sort((a, b) => {
            if (a.pen !== b.pen) return a.pen - b.pen;
            if (a.r.duration !== b.r.duration) return a.r.duration - b.r.duration;
            return a.r.distance - b.r.distance;
        });
        return scored[0].r;
    }

    /** Coi như mỗi ngày cùng khung opening/closing (HH:mm, VN). */
    private isFacilityOpenAt(
        openingTime: string | null | undefined,
        closingTime: string | null | undefined,
        at: Date,
    ): boolean {
        const openM = parseHHmmToMinutes(openingTime ?? undefined);
        const closeM = parseHHmmToMinutes(closingTime ?? undefined);
        if (openM === null || closeM === null) return true;
        const cur = getVietnamMinutesFromMidnight(at);
        if (openM <= closeM) {
            return cur >= openM && cur <= closeM;
        }
        return cur >= openM || cur <= closeM;
    }
}
