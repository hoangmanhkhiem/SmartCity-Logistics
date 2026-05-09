import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DriversService {
    constructor(private readonly prisma: PrismaService) {}

    async listDrivers() {
        const drivers = await this.prisma.user.findMany({
            where: {
                memberships: {
                    some: { role: { name: 'driver' } },
                },
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                isActive: true,
            },
            orderBy: { name: 'asc' },
        });
        if (drivers.length === 0) {
            return [];
        }
        const ids = drivers.map((d) => d.id);
        const counts = await this.prisma.assignment.groupBy({
            by: ['driverId'],
            where: { driverId: { in: ids } },
            _count: { _all: true },
        });
        const countByDriver = Object.fromEntries(counts.map((c) => [c.driverId, c._count._all]));
        return drivers.map((d) => ({
            id: d.id,
            name: d.name,
            email: d.email,
            phone: d.phone,
            isActive: d.isActive,
            assignmentsTotal: countByDriver[d.id] ?? 0,
        }));
    }

    async driverStats(id: string) {
        const user = await this.prisma.user.findFirst({
            where: {
                id,
                memberships: { some: { role: { name: 'driver' } } },
            },
        });
        if (!user) throw new NotFoundException('Driver not found');

        const byStatus = await this.prisma.assignment.groupBy({
            by: ['status'],
            where: { driverId: id },
            _count: { _all: true },
        });

        const recent = await this.prisma.assignment.findMany({
            where: { driverId: id },
            orderBy: { assignedAt: 'desc' },
            take: 10,
            include: {
                vehicle: { select: { plate: true, type: true } },
                leg: { include: { shipment: { include: { order: { select: { orderNumber: true } } } } } },
            },
        });

        return {
            driver: { id: user.id, name: user.name, email: user.email, phone: user.phone },
            assignmentsByStatus: Object.fromEntries(byStatus.map((b) => [b.status, b._count._all])),
            recentAssignments: recent,
        };
    }
}
