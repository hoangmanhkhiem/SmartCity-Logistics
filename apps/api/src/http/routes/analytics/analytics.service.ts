import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AnalyticsSnapshot, Carrier, Order, Route, Stop, Telemetry, Vehicle } from '../../../db/entities';
import { groupByField } from '../../../db/typeorm-query.util';

@Injectable()
export class AnalyticsService {
    constructor(
        @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
        @InjectRepository(Vehicle) private readonly vehicleRepo: Repository<Vehicle>,
        @InjectRepository(Route) private readonly routeRepo: Repository<Route>,
        @InjectRepository(Telemetry) private readonly telemetryRepo: Repository<Telemetry>,
        @InjectRepository(Carrier) private readonly carrierRepo: Repository<Carrier>,
        @InjectRepository(AnalyticsSnapshot) private readonly snapshotRepo: Repository<AnalyticsSnapshot>,
        @InjectRepository(Stop) private readonly stopRepo: Repository<Stop>,
    ) {}

    async platformSummary() {
        const since24h = new Date(Date.now() - 86400000);
        const [orderCounts, vehicleCounts, routeCounts, routeStats, unassignedOrders, telemetryPointsLast24h] =
            await Promise.all([
                groupByField(this.orderRepo, 'status'),
                groupByField(this.vehicleRepo, 'status'),
                groupByField(this.routeRepo, 'status'),
                this.routeRepo
                    .createQueryBuilder('r')
                    .select('SUM(r.estimated_co2_grams)', 'sumCo2')
                    .addSelect('AVG(r.total_distance_km)', 'avgKm')
                    .getRawOne<{ sumCo2: string | null; avgKm: string | null }>(),
                this.orderRepo.count({ where: { status: 'pending' } }),
                this.telemetryRepo
                    .createQueryBuilder('t')
                    .where('t.timestamp >= :since', { since: since24h })
                    .getCount(),
            ]);

        const ordersTotal = orderCounts.reduce((s, o) => s + o.count, 0);

        return {
            orders: {
                byStatus: Object.fromEntries(orderCounts.map((o) => [o.key, o.count])),
                total: ordersTotal,
            },
            vehicles: {
                byStatus: Object.fromEntries(vehicleCounts.map((v) => [v.key, v.count])),
            },
            routes: {
                byStatus: Object.fromEntries(routeCounts.map((r) => [r.key, r.count])),
            },
            environment: {
                estimatedCo2GramsTotal: routeStats?.sumCo2 != null ? Number(routeStats.sumCo2) : 0,
                avgRouteDistanceKm: routeStats?.avgKm != null ? Number(routeStats.avgKm) : 0,
            },
            operations: {
                unassignedOrders,
                telemetryPointsLast24h,
            },
        };
    }

    async createSnapshot(forDate?: Date) {
        const now = forDate ?? new Date();
        const snapshotDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
        const dayStart = snapshotDate;
        const dayEnd = new Date(dayStart);
        dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

        const carriers = await this.carrierRepo.find({ select: ['id'] });
        const scopes: Array<{ carrierId: number | null }> = [{ carrierId: null }, ...carriers.map((c) => ({ carrierId: c.id }))];

        const results = [];
        for (const scope of scopes) {
            const orderQb = this.orderRepo
                .createQueryBuilder('o')
                .where('o.createdAt >= :dayStart AND o.createdAt < :dayEnd', { dayStart, dayEnd });
            const routeQb = this.routeRepo
                .createQueryBuilder('r')
                .where('r.createdAt >= :dayStart AND r.createdAt < :dayEnd', { dayStart, dayEnd });
            if (scope.carrierId != null) {
                orderQb.andWhere('o.carrier_id = :carrierId', { carrierId: scope.carrierId });
                routeQb.andWhere('r.carrier_id = :carrierId', { carrierId: scope.carrierId });
            }

            const [ordersTotal, ordersDelivered, ordersFailed, routesCompleted, routeAgg, stopAgg] = await Promise.all([
                orderQb.getCount(),
                orderQb.clone().andWhere('o.status = :st', { st: 'delivered' }).getCount(),
                orderQb.clone().andWhere('o.status = :st', { st: 'failed' }).getCount(),
                routeQb.clone().andWhere('r.status = :st', { st: 'completed' }).getCount(),
                routeQb
                    .clone()
                    .andWhere('r.status = :st', { st: 'completed' })
                    .select('SUM(r.total_distance_km)', 'sumKm')
                    .addSelect('SUM(r.estimated_co2_grams)', 'sumCo2')
                    .getRawOne<{ sumKm: string | null; sumCo2: string | null }>(),
                this.stopRepo
                    .createQueryBuilder('s')
                    .innerJoin('s.route', 'route')
                    .where('s.completed_at >= :dayStart AND s.completed_at < :dayEnd', { dayStart, dayEnd })
                    .andWhere('s.cod_collected = :cod', { cod: true })
                    .andWhere(scope.carrierId != null ? 'route.carrier_id = :carrierId' : '1=1', {
                        carrierId: scope.carrierId ?? undefined,
                    })
                    .select('SUM(s.cod_amount_collected)', 'sumCod')
                    .getRawOne<{ sumCod: string | null }>(),
            ]);

            const fields = {
                ordersTotal,
                ordersDelivered,
                ordersFailed,
                routesCompleted,
                totalDistanceKm: routeAgg?.sumKm != null ? Number(routeAgg.sumKm) : 0,
                estimatedCo2Grams: routeAgg?.sumCo2 != null ? Number(routeAgg.sumCo2) : 0,
                codCollectedTotal: stopAgg?.sumCod != null ? Number(stopAgg.sumCod) : 0,
            };

            const existing =
                scope.carrierId === null
                    ? await this.snapshotRepo
                          .createQueryBuilder('snap')
                          .where('snap.snapshot_date = :snapshotDate', { snapshotDate })
                          .andWhere('snap.carrier_id IS NULL')
                          .getOne()
                    : await this.snapshotRepo.findOne({
                          where: { snapshotDate, carrierId: scope.carrierId },
                      });

            const snapshot = existing
                ? await this.snapshotRepo.save({ ...existing, ...fields })
                : await this.snapshotRepo.save(
                      this.snapshotRepo.create({ snapshotDate, carrierId: scope.carrierId, ...fields }),
                  );
            results.push(snapshot);
        }

        return { snapshotDate, count: results.length, snapshots: results };
    }

    async getTrend(params: { carrierId?: number; from?: string; to?: string }) {
        const from = params.from ? new Date(params.from) : new Date(Date.now() - 30 * 86400000);
        const to = params.to ? new Date(params.to) : new Date();

        const qb = this.snapshotRepo
            .createQueryBuilder('s')
            .where('s.snapshot_date >= :from AND s.snapshot_date <= :to', { from, to })
            .orderBy('s.snapshot_date', 'ASC');
        if (params.carrierId != null) {
            qb.andWhere('s.carrier_id = :carrierId', { carrierId: params.carrierId });
        } else {
            qb.andWhere('s.carrier_id IS NULL');
        }
        return qb.getMany();
    }

    async getComplianceReport(params: { from?: string; to?: string }) {
        const from = params.from ? new Date(params.from) : new Date(Date.now() - 30 * 86400000);
        const to = params.to ? new Date(params.to) : new Date();

        const snapshots = await this.snapshotRepo
            .createQueryBuilder('s')
            .where('s.carrier_id IS NOT NULL')
            .andWhere('s.snapshot_date >= :from AND s.snapshot_date <= :to', { from, to })
            .getMany();

        const carrierIds = [...new Set(snapshots.map((s) => s.carrierId).filter((id): id is number => id != null))];
        const carriers = carrierIds.length
            ? await this.carrierRepo.find({ where: { id: In(carrierIds) }, select: ['id', 'name'] })
            : [];
        const carrierName = Object.fromEntries(carriers.map((c) => [c.id, c.name]));

        const byCarrier = new Map<
            number,
            {
                carrierId: number;
                carrierName: string;
                ordersTotal: number;
                ordersDelivered: number;
                ordersFailed: number;
                routesCompleted: number;
                totalDistanceKm: number;
                estimatedCo2Grams: number;
                codCollectedTotal: number;
            }
        >();

        for (const s of snapshots) {
            if (s.carrierId == null) continue;
            const entry = byCarrier.get(s.carrierId) ?? {
                carrierId: s.carrierId,
                carrierName: carrierName[s.carrierId] ?? `Carrier #${s.carrierId}`,
                ordersTotal: 0,
                ordersDelivered: 0,
                ordersFailed: 0,
                routesCompleted: 0,
                totalDistanceKm: 0,
                estimatedCo2Grams: 0,
                codCollectedTotal: 0,
            };
            entry.ordersTotal += s.ordersTotal;
            entry.ordersDelivered += s.ordersDelivered;
            entry.ordersFailed += s.ordersFailed;
            entry.routesCompleted += s.routesCompleted;
            entry.totalDistanceKm += s.totalDistanceKm ?? 0;
            entry.estimatedCo2Grams += s.estimatedCo2Grams ?? 0;
            entry.codCollectedTotal += s.codCollectedTotal ?? 0;
            byCarrier.set(s.carrierId, entry);
        }

        const rows = [...byCarrier.values()].map((r) => ({
            ...r,
            successRate: r.ordersTotal > 0 ? Math.round((r.ordersDelivered / r.ordersTotal) * 1000) / 10 : null,
        }));

        const totals = rows.reduce(
            (acc, r) => ({
                ordersTotal: acc.ordersTotal + r.ordersTotal,
                ordersDelivered: acc.ordersDelivered + r.ordersDelivered,
                estimatedCo2Grams: acc.estimatedCo2Grams + r.estimatedCo2Grams,
                codCollectedTotal: acc.codCollectedTotal + r.codCollectedTotal,
            }),
            { ordersTotal: 0, ordersDelivered: 0, estimatedCo2Grams: 0, codCollectedTotal: 0 },
        );

        return {
            from,
            to,
            totals: {
                ...totals,
                successRate:
                    totals.ordersTotal > 0
                        ? Math.round((totals.ordersDelivered / totals.ordersTotal) * 1000) / 10
                        : null,
            },
            byCarrier: rows,
        };
    }
}
