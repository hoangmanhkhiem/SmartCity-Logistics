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
     * Dùng bảng phí (baseFeeVnd/perKmFeeVnd/perKgFeeVnd) do carrier tự cấu hình — không còn suy ra từ carrier.id.
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
            const base = c.baseFeeVnd;
            const perKm = c.perKmFeeVnd;
            const extraKg = Math.max(0, w - 1);
            const estimateVnd = Math.round(base + distanceKm * perKm + extraKg * c.perKgFeeVnd);
            const etaMin = Math.round(20 + distanceKm * 3.5);
            return {
                carrierId: c.id,
                carrierName: c.name,
                organization: c.organization?.name,
                estimatedFeeVnd: estimateVnd,
                estimatedEtaMinutes: etaMin,
                modelNote: 'Ước lượng theo bảng phí carrier tự cấu hình (phí mở chuyến + phí/km + phí/kg vượt 1kg đầu) — không phải giá cam kết cuối cùng.',
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
