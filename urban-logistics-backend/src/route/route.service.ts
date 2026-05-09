import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { haversineKm } from '../common/utils/geo';
import { CreateRouteDto, UpdateRouteDto } from './dto';
import { StopPointDto } from './dto/optimize-stops.dto';

@Injectable()
export class RouteService {
    constructor(private readonly prisma: PrismaService) { }

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
}
