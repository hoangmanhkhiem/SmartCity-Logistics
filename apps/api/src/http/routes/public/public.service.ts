import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Zone, Facility, Order, Route } from '../../../db/entities';
import { RestrictionService } from '../traffic-restriction/restriction.service';
import { haversineKm } from '../../middlewares/utils/geo';

@Injectable()
export class PublicService {
    constructor(
        @InjectRepository(Zone) private readonly zoneRepo: Repository<Zone>,
        @InjectRepository(Facility) private readonly facilityRepo: Repository<Facility>,
        @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
        @InjectRepository(Route) private readonly routeRepo: Repository<Route>,
        private readonly restrictionService: RestrictionService,
    ) {}

    async mapLayers() {
        const at = new Date();
        const [zones, facilities, restrictionsGeo] = await Promise.all([
            this.zoneRepo.find({
                where: { isActive: true, verified: true },
                select: ['id', 'name', 'type', 'boundary', 'source'],
            }),
            this.facilityRepo.find({
                where: { isActive: true, verified: true },
                select: ['id', 'name', 'kind', 'latitude', 'longitude', 'zoneId', 'source'],
            }),
            this.restrictionService.findActiveAsGeoJson(at),
        ]);

        return {
            generatedAt: at.toISOString(),
            disclaimer:
                'Dữ liệu demo đề tài B2025-GHA-05; có thể chứa bản ghi simulated. Không dùng cho điều phối thật.',
            zones,
            facilities,
            restrictions: restrictionsGeo,
        };
    }

    async zoneKpi() {
        const zones = await this.zoneRepo.find({
            where: { isActive: true, verified: true },
            select: ['id', 'name', 'type'],
        });

        const rows = await Promise.all(
            zones.map(async (z) => {
                const [facilityCount, orderCount, routeAgg] = await Promise.all([
                    this.facilityRepo.count({ where: { zoneId: z.id, verified: true } }),
                    this.orderRepo.count({ where: { zoneId: z.id, verified: true } }),
                    this.routeRepo
                        .createQueryBuilder('r')
                        .select('AVG(r.total_distance_km)', 'avgKm')
                        .addSelect('SUM(r.estimated_co2_grams)', 'sumCo2')
                        .where('r.zone_id = :zoneId', { zoneId: z.id })
                        .andWhere('r.status = :status', { status: 'completed' })
                        .getRawOne<{ avgKm: string | null; sumCo2: string | null }>(),
                ]);
                const n = orderCount;
                return {
                    zoneId: z.id,
                    zoneName: z.name,
                    zoneType: z.type,
                    facilityCount,
                    orderCount: n,
                    publicVisible: n >= 5,
                    avgRouteKm: n >= 5 ? (routeAgg?.avgKm != null ? Number(routeAgg.avgKm) : null) : null,
                    co2eGramsTotal: n >= 5 ? (routeAgg?.sumCo2 != null ? Number(routeAgg.sumCo2) : null) : null,
                };
            }),
        );

        return { zones: rows };
    }

    async facilitiesNear(params: {
        minLat?: number;
        minLon?: number;
        maxLat?: number;
        maxLon?: number;
        lat?: number;
        lon?: number;
        radiusKm?: number;
        kind?: string;
        limit?: number;
    }) {
        const limit = Math.min(params.limit ?? 200, 500);
        const where = {
            isActive: true,
            verified: true,
            ...(params.kind ? { kind: params.kind } : {}),
        };
        const list = await this.facilityRepo.find({
            where,
            select: ['id', 'name', 'kind', 'latitude', 'longitude', 'zoneId', 'source'],
            take: 2000,
        });

        let filtered = list;
        if (
            params.minLat != null &&
            params.maxLat != null &&
            params.minLon != null &&
            params.maxLon != null
        ) {
            filtered = list.filter(
                (f) =>
                    f.latitude >= params.minLat! &&
                    f.latitude <= params.maxLat! &&
                    f.longitude >= params.minLon! &&
                    f.longitude <= params.maxLon!,
            );
        } else if (params.lat != null && params.lon != null) {
            const radius = params.radiusKm ?? 3;
            filtered = list
                .map((f) => ({
                    f,
                    d: haversineKm(params.lat!, params.lon!, f.latitude, f.longitude),
                }))
                .filter((x) => x.d <= radius)
                .sort((a, b) => a.d - b.d)
                .map((x) => ({ ...x.f, distanceKm: Math.round(x.d * 100) / 100 }));
        }

        return { data: filtered.slice(0, limit), meta: { count: filtered.length } };
    }
}
