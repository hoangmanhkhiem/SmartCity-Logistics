import { Injectable, NotFoundException } from '@nestjs/common';
import { booleanPointInPolygon, point as turfPoint } from '@turf/turf';
import { PrismaService } from '../prisma/prisma.service';
import { CreateZoneDto, UpdateZoneDto } from './dto';

@Injectable()
export class ZoneService {
    constructor(private readonly prisma: PrismaService) { }

    async create(dto: CreateZoneDto) { return this.prisma.zone.create({ data: dto }); }

    /** Suy ra zoneId chứa tọa độ (lat, lon) bằng point-in-polygon trên Zone.boundary (GeoJSON). Trả null nếu không khớp zone nào. */
    async findZoneIdForPoint(lat: number, lon: number): Promise<number | null> {
        const zones = await this.prisma.zone.findMany({
            where: { isActive: true, boundary: { not: null } },
            select: { id: true, boundary: true },
        });
        const pt = turfPoint([lon, lat]);
        for (const z of zones) {
            if (!z.boundary) continue;
            try {
                const geometry = JSON.parse(z.boundary);
                const polygon = geometry.type === 'Feature' ? geometry : { type: 'Feature', properties: {}, geometry };
                if (booleanPointInPolygon(pt, polygon)) return z.id;
            } catch {
                continue;
            }
        }
        return null;
    }

    async findAll(page = 1, limit = 10, type?: string) {
        const pageNum = Number(page) || 1;
        const limitNum = Number(limit) || 10;
        const skip = (pageNum - 1) * limitNum;
        const where = type ? { type } : {};
        const [data, total] = await Promise.all([
            this.prisma.zone.findMany({ where, skip, take: limitNum, include: { _count: { select: { facilities: true, roadSegments: true, restrictions: true } } }, orderBy: { name: 'asc' } }),
            this.prisma.zone.count({ where }),
        ]);
        return { data, meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) } };
    }

    async findOne(id: number) {
        const z = await this.prisma.zone.findUnique({ where: { id }, include: { facilities: true, roadSegments: true, restrictions: true } });
        if (!z) throw new NotFoundException(`Zone ${id} not found`);
        return z;
    }

    async update(id: number, dto: UpdateZoneDto) { await this.findOne(id); return this.prisma.zone.update({ where: { id }, data: dto }); }

    async remove(id: number) { await this.findOne(id); return this.prisma.zone.delete({ where: { id } }); }
}
