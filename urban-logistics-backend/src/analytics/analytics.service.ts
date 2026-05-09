import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
    constructor(private readonly prisma: PrismaService) {}

    async platformSummary() {
        const [
            orderCounts,
            vehicleCounts,
            assignmentCounts,
            routeCo2,
            openLegs,
            telemetryLast24h,
        ] = await Promise.all([
            this.prisma.order.groupBy({ by: ['status'], _count: { _all: true } }),
            this.prisma.vehicle.groupBy({ by: ['status'], _count: { _all: true } }),
            this.prisma.assignment.groupBy({ by: ['status'], _count: { _all: true } }),
            this.prisma.route.aggregate({ _sum: { estimatedCo2: true }, _avg: { totalDistance: true } }),
            this.prisma.leg.count({ where: { assignments: { none: {} } } }),
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
            assignments: {
                byStatus: Object.fromEntries(assignmentCounts.map((a) => [a.status, a._count._all])),
            },
            environment: {
                estimatedCo2GramsTotal: routeCo2._sum.estimatedCo2 ?? 0,
                avgRouteDistanceKm: routeCo2._avg.totalDistance ?? 0,
            },
            operations: {
                unassignedLegs: openLegs,
                telemetryPointsLast24h: telemetryLast24h,
            },
        };
    }
}
