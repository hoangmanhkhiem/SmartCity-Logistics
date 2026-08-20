import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
    constructor(private readonly prisma: PrismaService) {}

    async platformSummary() {
        const [
            orderCounts,
            vehicleCounts,
            routeCounts,
            routeStats,
            unassignedOrders,
            telemetryLast24h,
        ] = await Promise.all([
            this.prisma.order.groupBy({ by: ['status'], _count: { _all: true } }),
            this.prisma.vehicle.groupBy({ by: ['status'], _count: { _all: true } }),
            this.prisma.route.groupBy({ by: ['status'], _count: { _all: true } }),
            this.prisma.route.aggregate({ _sum: { estimatedCo2Grams: true }, _avg: { totalDistanceKm: true } }),
            this.prisma.order.count({ where: { status: 'pending' } }),
            this.prisma.telemetry.count({
                where: { timestamp: { gte: new Date(Date.now() - 86400000) } },
            }),
        ]);

        const ordersTotal = orderCounts.reduce((s, o) => s + o._count._all, 0);

        return {
            orders: {
                byStatus: Object.fromEntries(orderCounts.map((o) => [o.status, o._count._all])),
                total: ordersTotal,
            },
            vehicles: {
                byStatus: Object.fromEntries(vehicleCounts.map((v) => [v.status, v._count._all])),
            },
            routes: {
                byStatus: Object.fromEntries(routeCounts.map((r) => [r.status, r._count._all])),
            },
            environment: {
                estimatedCo2GramsTotal: routeStats._sum.estimatedCo2Grams ?? 0,
                avgRouteDistanceKm: routeStats._avg.totalDistanceKm ?? 0,
            },
            operations: {
                unassignedOrders,
                telemetryPointsLast24h: telemetryLast24h,
            },
        };
    }

    /**
     * Ghi 1 snapshot cho ngày hiện tại (toàn nền tảng + từng carrier).
     * Gọi thủ công hoặc qua cron ngoài (Windows Task Scheduler / cron job) 1 lần/ngày.
     */
    async createSnapshot() {
        const now = new Date();
        const snapshotDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
        const dayStart = snapshotDate;
        const dayEnd = new Date(dayStart);
        dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

        const carriers = await this.prisma.carrier.findMany({ select: { id: true } });
        const scopes: Array<{ carrierId: number | null }> = [{ carrierId: null }, ...carriers.map((c) => ({ carrierId: c.id }))];

        const results = [];
        for (const scope of scopes) {
            const orderWhere = {
                createdAt: { gte: dayStart, lt: dayEnd },
                ...(scope.carrierId != null && { carrierId: scope.carrierId }),
            };
            const routeWhere = {
                createdAt: { gte: dayStart, lt: dayEnd },
                ...(scope.carrierId != null && { carrierId: scope.carrierId }),
            };

            const [ordersTotal, ordersDelivered, ordersFailed, routesCompleted, routeAgg, stopAgg] = await Promise.all([
                this.prisma.order.count({ where: orderWhere }),
                this.prisma.order.count({ where: { ...orderWhere, status: 'delivered' } }),
                this.prisma.order.count({ where: { ...orderWhere, status: 'failed' } }),
                this.prisma.route.count({ where: { ...routeWhere, status: 'completed' } }),
                this.prisma.route.aggregate({
                    where: { ...routeWhere, status: 'completed' },
                    _sum: { totalDistanceKm: true, estimatedCo2Grams: true },
                }),
                this.prisma.stop.aggregate({
                    where: {
                        completedAt: { gte: dayStart, lt: dayEnd },
                        codCollected: true,
                        ...(scope.carrierId != null && { route: { carrierId: scope.carrierId } }),
                    },
                    _sum: { codAmountCollected: true },
                }),
            ]);

            const fields = {
                ordersTotal,
                ordersDelivered,
                ordersFailed,
                routesCompleted,
                totalDistanceKm: routeAgg._sum.totalDistanceKm ?? 0,
                estimatedCo2Grams: routeAgg._sum.estimatedCo2Grams ?? 0,
                codCollectedTotal: stopAgg._sum.codAmountCollected ?? 0,
            };

            // Prisma không cho phép null trong compound unique where (snapshotDate_carrierId) —
            // dùng findFirst + create/update thủ công để hỗ trợ carrierId=null (scope toàn nền tảng).
            const existing = await this.prisma.analyticsSnapshot.findFirst({
                where: { snapshotDate, carrierId: scope.carrierId },
            });
            const snapshot = existing
                ? await this.prisma.analyticsSnapshot.update({ where: { id: existing.id }, data: fields })
                : await this.prisma.analyticsSnapshot.create({ data: { snapshotDate, carrierId: scope.carrierId, ...fields } });
            results.push(snapshot);
        }

        return { snapshotDate, count: results.length, snapshots: results };
    }

    /** Chuỗi thời gian snapshot theo ngày, dùng cho biểu đồ xu hướng. */
    async getTrend(params: { carrierId?: number; from?: string; to?: string }) {
        const from = params.from ? new Date(params.from) : new Date(Date.now() - 30 * 86400000);
        const to = params.to ? new Date(params.to) : new Date();

        return this.prisma.analyticsSnapshot.findMany({
            where: {
                carrierId: params.carrierId ?? null,
                snapshotDate: { gte: from, lte: to },
            },
            orderBy: { snapshotDate: 'asc' },
        });
    }

    /** Báo cáo tuân thủ + CO2 + kinh tế theo carrier, dùng cho Regulator export. */
    async getComplianceReport(params: { from?: string; to?: string }) {
        const from = params.from ? new Date(params.from) : new Date(Date.now() - 30 * 86400000);
        const to = params.to ? new Date(params.to) : new Date();

        const snapshots = await this.prisma.analyticsSnapshot.findMany({
            where: { carrierId: { not: null }, snapshotDate: { gte: from, lte: to } },
        });

        const carrierIds = [...new Set(snapshots.map((s) => s.carrierId).filter((id): id is number => id != null))];
        const carriers = await this.prisma.carrier.findMany({
            where: { id: { in: carrierIds } },
            select: { id: true, name: true },
        });
        const carrierName = Object.fromEntries(carriers.map((c) => [c.id, c.name]));

        const byCarrier = new Map<number, {
            carrierId: number;
            carrierName: string;
            ordersTotal: number;
            ordersDelivered: number;
            ordersFailed: number;
            routesCompleted: number;
            totalDistanceKm: number;
            estimatedCo2Grams: number;
            codCollectedTotal: number;
        }>();

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
                successRate: totals.ordersTotal > 0 ? Math.round((totals.ordersDelivered / totals.ordersTotal) * 1000) / 10 : null,
            },
            byCarrier: rows,
        };
    }
}
