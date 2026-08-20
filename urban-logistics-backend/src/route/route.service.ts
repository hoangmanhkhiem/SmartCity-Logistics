import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { lineString, point, pointToLineDistance, nearestPointOnLine, destination, bearing } from '@turf/turf';
import { PrismaService } from '../prisma/prisma.service';
import { haversineKm } from '../common/utils/geo';
import {
    getVietnamMinutesFromMidnight,
    parseHHmmToMinutes,
} from '../traffic-restriction/utils/restriction-time.util';
import { CreateRouteFromOrdersDto, UpdateRouteDto } from './dto';
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

    /** Đơn hàng chưa gom vào route nào (status=pending) của 1 carrier, lọc theo zone tuỳ chọn. */
    unassignedOrders(carrierId: number, zoneId?: number) {
        return this.prisma.order.findMany({
            where: { carrierId, status: 'pending', ...(zoneId && { zoneId }) },
            include: { zone: true, customer: { select: { id: true, name: true, phone: true } } },
            orderBy: { createdAt: 'asc' },
        });
    }

    /** Gợi ý xe + shipper đang rảnh (on_shift) gần zone nhất theo telemetry mới nhất. */
    async suggestVehicleAndShipperForZone(carrierId: number, zoneId?: number) {
        const shippers = await this.prisma.shipperProfile.findMany({
            where: { carrierId, status: 'on_shift', currentVehicleId: { not: null } },
            include: {
                user: { select: { id: true, name: true, phone: true } },
                currentVehicle: {
                    include: { telemetries: { orderBy: { timestamp: 'desc' }, take: 1 } },
                },
            },
        });

        const zone = zoneId ? await this.prisma.zone.findUnique({ where: { id: zoneId } }) : null;

        const candidates = shippers
            .filter((s) => s.currentVehicle)
            .map((s) => {
                const t = s.currentVehicle!.telemetries[0];
                return { shipper: s, vehicle: s.currentVehicle!, telemetry: t };
            });

        if (!candidates.length) {
            return { suggestion: null, note: 'Không có shipper đang trong ca (on_shift) của carrier này' };
        }

        // Không có tâm zone chính xác (chỉ có boundary GeoJSON) — nếu không xác định được, trả candidate đầu tiên có telemetry.
        const withTelemetry = candidates.filter((c) => c.telemetry);
        const chosen = withTelemetry[0] ?? candidates[0];

        return {
            suggestion: {
                shipperId: chosen.shipper.userId,
                shipperName: chosen.shipper.user.name,
                vehicleId: chosen.vehicle.id,
                plate: chosen.vehicle.plate,
            },
            zone: zone ? { id: zone.id, name: zone.name } : null,
            usedTelemetry: Boolean(chosen.telemetry),
        };
    }

    /** Gom N order cùng carrier/zone thành 1 Route cho 1 vehicle + 1 shipper trong 1 ca. */
    async createRouteFromOrders(dto: CreateRouteFromOrdersDto) {
        const vehicle = await this.prisma.vehicle.findUnique({ where: { id: dto.vehicleId } });
        if (!vehicle || vehicle.carrierId !== dto.carrierId) {
            throw new BadRequestException('Vehicle không thuộc carrier');
        }
        const shipperProfile = await this.prisma.shipperProfile.findUnique({ where: { userId: dto.shipperId } });
        if (!shipperProfile || shipperProfile.carrierId !== dto.carrierId) {
            throw new BadRequestException('Shipper không thuộc carrier');
        }

        const uniqueOrderIds = [...new Set(dto.orderIds)];
        const orders = await this.prisma.order.findMany({ where: { id: { in: uniqueOrderIds } } });
        if (orders.length !== uniqueOrderIds.length) {
            throw new NotFoundException('Một số order không tồn tại');
        }
        const invalid = orders.find((o) => o.carrierId !== dto.carrierId || o.status !== 'pending');
        if (invalid) {
            throw new BadRequestException(`Order ${invalid.id} không thuộc carrier hoặc không ở trạng thái pending`);
        }

        // Validate restriction (chặn trừ khi force=true)
        if (dto.zoneId && !dto.force) {
            const totalWeight = orders.reduce((s, o) => s + (o.weightKg ?? 0), 0);
            const at = dto.plannedStartAt ? new Date(dto.plannedStartAt) : new Date();
            const violations = await this.restrictionService.checkVehicleAllowedInZone(
                vehicle.type,
                dto.zoneId,
                at,
                totalWeight,
            );
            if (violations.length) {
                throw new BadRequestException({
                    message: 'Vi phạm quy định hạn chế giao thông trong zone — dùng force=true để bỏ qua',
                    violations,
                });
            }
        }

        // Tối ưu thứ tự điểm (pickup + delivery mỗi order)
        const points: StopPointDto[] = [];
        for (const o of orders) {
            if (o.pickupLat != null && o.pickupLon != null) {
                points.push({ id: `pickup:${o.id}`, lat: o.pickupLat, lon: o.pickupLon });
            }
            if (o.deliveryLat != null && o.deliveryLon != null) {
                points.push({ id: `delivery:${o.id}`, lat: o.deliveryLat, lon: o.deliveryLon });
            }
        }
        const optimized = points.length ? this.optimizeStopSequence(points) : null;
        const orderedPoints = optimized?.orderedPoints ?? points;

        const code = `RT-${dto.shiftDate.replace(/-/g, '')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

        return this.prisma.$transaction(async (tx) => {
            const route = await tx.route.create({
                data: {
                    carrierId: dto.carrierId,
                    vehicleId: dto.vehicleId,
                    shipperId: dto.shipperId,
                    zoneId: dto.zoneId,
                    code,
                    shiftDate: new Date(dto.shiftDate),
                    status: 'planned',
                    plannedStartAt: dto.plannedStartAt ? new Date(dto.plannedStartAt) : undefined,
                    totalDistanceKm: optimized?.approximateTotalKm,
                },
            });

            let sequence = 1;
            for (const p of orderedPoints) {
                const [type, orderIdStr] = (p.id ?? '').split(':');
                const order = orders.find((o) => o.id === Number(orderIdStr));
                if (!order) continue;
                await tx.stop.create({
                    data: {
                        routeId: route.id,
                        orderId: order.id,
                        sequence: sequence++,
                        type,
                        address: type === 'pickup' ? order.pickupAddress : order.deliveryAddress,
                        latitude: p.lat,
                        longitude: p.lon,
                        contactPhone: type === 'pickup' ? order.pickupPhone : order.deliveryPhone,
                        timeWindowStart: order.timeWindowStart,
                        timeWindowEnd: order.timeWindowEnd,
                        ...(type === 'delivery' && { codAmountDue: order.codAmount ?? 0 }),
                    },
                });
            }

            await tx.order.updateMany({
                where: { id: { in: uniqueOrderIds } },
                data: { status: 'assigned' },
            });

            return tx.route.findUnique({
                where: { id: route.id },
                include: { stops: { orderBy: { sequence: 'asc' } }, vehicle: true, shipper: true },
            });
        });
    }

    async findAll(page = 1, limit = 10, carrierId?: string, status?: string, shipperId?: string) {
        const pageNum = Number(page) || 1; const limitNum = Number(limit) || 10; const skip = (pageNum - 1) * limitNum;
        const where = {
            ...(carrierId && { carrierId: Number(carrierId) }),
            ...(status && { status }),
            ...(shipperId && { shipperId: Number(shipperId) }),
        };
        const [data, total] = await Promise.all([
            this.prisma.route.findMany({
                where,
                skip,
                take: limitNum,
                include: { vehicle: true, shipper: { select: { id: true, name: true, phone: true } }, _count: { select: { stops: true } } },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.route.count({ where }),
        ]);
        return { data, meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) } };
    }

    async findOne(id: number) {
        const r = await this.prisma.route.findUnique({
            where: { id },
            include: {
                vehicle: true,
                shipper: { select: { id: true, name: true, phone: true } },
                stops: { orderBy: { sequence: 'asc' }, include: { order: true } },
            },
        });
        if (!r) throw new NotFoundException(`Route ${id} not found`);
        return r;
    }

    async update(id: number, dto: UpdateRouteDto) {
        await this.findOne(id);
        return this.prisma.route.update({
            where: { id },
            data: {
                ...dto,
                plannedStartAt: dto.plannedStartAt ? new Date(dto.plannedStartAt) : undefined,
                plannedEndAt: dto.plannedEndAt ? new Date(dto.plannedEndAt) : undefined,
            },
        });
    }

    async remove(id: number) { await this.findOne(id); return this.prisma.route.delete({ where: { id } }); }

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
     * Nếu tuyến tốt nhất vẫn chồng lấn đoạn `prohibited`, thử ép vòng qua 1 waypoint né hẳn khu vực đó.
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
        let route = this.pickBestRouteAmongAlternatives(routes, restrictions);
        let usedWaypoint = false;

        const prohibitedOverlap = this.findProhibitedOverlap(route.geometry.coordinates, restrictions);
        if (prohibitedOverlap) {
            const waypoint = this.computeAvoidanceWaypoint(prohibitedOverlap);
            try {
                const waypointRoutes = await this.fetchMapboxDrivingAlternatives(
                    dto.originLon,
                    dto.originLat,
                    dto.destLon,
                    dto.destLat,
                    token,
                    [waypoint],
                );
                if (waypointRoutes.length) {
                    const bestWithWaypoint = this.pickBestRouteAmongAlternatives(waypointRoutes, restrictions);
                    const currentPenalty = this.restrictionOverlapPenalty(route.geometry.coordinates, restrictions);
                    const waypointPenalty = this.restrictionOverlapPenalty(bestWithWaypoint.geometry.coordinates, restrictions);
                    if (waypointPenalty < currentPenalty) {
                        route = bestWithWaypoint;
                        usedWaypoint = true;
                    }
                }
            } catch {
                /* giữ tuyến gốc nếu gọi Mapbox với waypoint thất bại */
            }
        }

        return {
            route: {
                distance: route.distance,
                duration: route.duration,
                geometry: route.geometry,
            },
            restrictionsGeoJson: restrictions,
            avoidedProhibited: usedWaypoint,
            routingNote: usedWaypoint
                ? 'Đã chèn điểm vòng để né đoạn cấm hoàn toàn (severity=prohibited).'
                : 'Trong các phương án Mapbox, chọn tuyến có điểm phạt thấp nhất khi lệch gần đoạn cấm/hạn chế (ước lượng; không thay cho cấm đường chính thức).',
        };
    }

    /** Tìm restriction `prohibited` (LineString) mà tuyến hiện tại đi sát/qua (trong 40m). */
    private findProhibitedOverlap(
        routeCoords: [number, number][],
        restrictions: GeoJsonFeatureCollection,
        thresholdM = 40,
    ): number[][] | null {
        for (const f of restrictions.features ?? []) {
            if (f.properties?.severity !== 'prohibited') continue;
            const g = f.geometry as { type?: string; coordinates?: number[][] };
            if (g?.type !== 'LineString' || !g.coordinates?.length || g.coordinates.length < 2) continue;
            try {
                const rl = lineString(g.coordinates);
                const step = Math.max(1, Math.ceil(routeCoords.length / 60));
                for (let i = 0; i < routeCoords.length; i += step) {
                    const d = pointToLineDistance(point(routeCoords[i]), rl, { units: 'meters' });
                    if (d < thresholdM) return g.coordinates;
                }
            } catch {
                continue;
            }
        }
        return null;
    }

    /** Điểm lệch vuông góc ~200m khỏi trung điểm đoạn cấm, dùng làm waypoint ép Mapbox vòng qua. */
    private computeAvoidanceWaypoint(prohibitedCoords: number[][]): [number, number] {
        const rl = lineString(prohibitedCoords);
        const midIdx = Math.floor(prohibitedCoords.length / 2);
        const midPoint = point(prohibitedCoords[midIdx]);
        const nearest = nearestPointOnLine(rl, midPoint);
        const segBearing = bearing(point(prohibitedCoords[Math.max(0, midIdx - 1)]), point(prohibitedCoords[midIdx]));
        const perpendicular = segBearing + 90;
        const offset = destination(nearest, 0.2, perpendicular, { units: 'kilometers' });
        const [lon, lat] = offset.geometry.coordinates;
        return [lon, lat];
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
        waypoints: Array<[number, number]> = [],
    ): Promise<Array<{ distance: number; duration: number; geometry: { coordinates: [number, number][] } }>> {
        const waypointsStr = waypoints.map(([lon, lat]) => `${lon},${lat}`).join(';');
        const coordsStr = waypointsStr
            ? `${originLon},${originLat};${waypointsStr};${destLon},${destLat}`
            : `${originLon},${originLat};${destLon},${destLat}`;
        const params = new URLSearchParams({
            geometries: 'geojson',
            overview: 'full',
            access_token: token,
            // Mapbox không hỗ trợ alternatives khi có waypoint trung gian
            alternatives: waypoints.length ? 'false' : 'true',
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
