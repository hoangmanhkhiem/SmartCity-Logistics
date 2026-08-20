import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ZoneService } from '../zone/zone.service';
import { haversineKm } from '../common/utils/geo';
import { CreateCarrierDto, UpdateCarrierDto, UpdateCarrierZonesDto } from './dto';

@Injectable()
export class CarrierService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly zoneService: ZoneService,
    ) { }

    async create(createDto: CreateCarrierDto) {
        return this.prisma.carrier.create({ data: createDto, include: { organization: true } });
    }

    async findAll(page = 1, limit = 10, organizationId?: string) {
        const pageNum = Number(page) || 1; const limitNum = Number(limit) || 10; const skip = (pageNum - 1) * limitNum;
        const where = organizationId ? { organizationId: Number(organizationId) } : {};
        const [data, total] = await Promise.all([
            this.prisma.carrier.findMany({ where, skip, take: limitNum, include: { organization: true, _count: { select: { vehicles: true } } }, orderBy: { createdAt: 'desc' } }),
            this.prisma.carrier.count({ where }),
        ]);
        return { data, meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) } };
    }

    async findOne(id: number) {
        const carrier = await this.prisma.carrier.findUnique({ where: { id }, include: { organization: true, vehicles: true } });
        if (!carrier) throw new NotFoundException(`Carrier ${id} not found`);
        return carrier;
    }

    async update(id: number, updateDto: UpdateCarrierDto) {
        await this.findOne(id);
        return this.prisma.carrier.update({ where: { id }, data: updateDto, include: { organization: true } });
    }

    async remove(id: number) {
        await this.findOne(id);
        return this.prisma.carrier.delete({ where: { id } });
    }

    async updateZones(id: number, dto: UpdateCarrierZonesDto) {
        await this.findOne(id);
        return this.prisma.carrier.update({ where: { id }, data: { operatingZoneIds: dto.zoneIds } });
    }

    /**
     * So sánh phí ước tính giữa các carrier THẬT đang phục vụ khu vực điểm giao.
     * Ước lượng đơn giản (không phải giá thật của hãng) — dùng để khách hàng chọn carrier khi đặt đơn.
     */
    async compareForRoute(params: {
        pickupLat: number;
        pickupLon: number;
        deliveryLat: number;
        deliveryLon: number;
        weightKg?: number;
    }) {
        const zoneId = await this.zoneService.findZoneIdForPoint(params.deliveryLat, params.deliveryLon);
        const distanceKm = haversineKm(params.pickupLat, params.pickupLon, params.deliveryLat, params.deliveryLon);
        const w = params.weightKg ?? 1;

        const allCarriers = await this.prisma.carrier.findMany({
            where: { isActive: true },
            include: { organization: true },
        });

        const eligible = zoneId != null
            ? allCarriers.filter((c) => (c.operatingZoneIds as number[]).includes(zoneId))
            : allCarriers;

        const quotes = eligible.map((c) => {
            const base = 12000 + (c.id % 5) * 800;
            const perKm = 3500 + (c.id % 4) * 300;
            const perKg = 1800;
            const estimateVnd = Math.round(base + distanceKm * perKm + w * perKg);
            const etaMin = Math.round(20 + distanceKm * 3.5 + (c.id % 3) * 5);
            return {
                carrierId: c.id,
                carrierName: c.name,
                organization: c.organization?.name,
                estimatedFeeVnd: estimateVnd,
                estimatedEtaMinutes: etaMin,
                modelNote: 'Ước lượng nội bộ dựa trên khoảng cách/khối lượng — không phải giá cam kết cuối cùng.',
            };
        });

        quotes.sort((a, b) => a.estimatedFeeVnd - b.estimatedFeeVnd);

        return {
            zoneId,
            distanceKm: Math.round(distanceKm * 1000) / 1000,
            weightKg: w,
            quotes,
        };
    }
}
