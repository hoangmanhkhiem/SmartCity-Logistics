import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Carrier, Vehicle } from '../../../db/entities';
import { ZoneService } from '../zone/zone.service';
import { haversineKm } from '../../middlewares/utils/geo';
import { CreateCarrierDto, UpdateCarrierDto, UpdateCarrierZonesDto } from './dto';

@Injectable()
export class CarrierService {
    constructor(
        @InjectRepository(Carrier) private readonly carrierRepo: Repository<Carrier>,
        @InjectRepository(Vehicle) private readonly vehicleRepo: Repository<Vehicle>,
        private readonly zoneService: ZoneService,
    ) {}

    async create(createDto: CreateCarrierDto) {
        const saved = await this.carrierRepo.save(this.carrierRepo.create(createDto));
        return this.carrierRepo.findOne({ where: { id: saved.id }, relations: ['organization'] });
    }

    async findAll(page = 1, limit = 10, organizationId?: string) {
        const pageNum = Number(page) || 1;
        const limitNum = Number(limit) || 10;
        const skip = (pageNum - 1) * limitNum;
        const where = organizationId ? { organizationId: Number(organizationId) } : {};
        const [rows, total] = await Promise.all([
            this.carrierRepo.find({
                where,
                skip,
                take: limitNum,
                relations: ['organization'],
                order: { createdAt: 'DESC' },
            }),
            this.carrierRepo.count({ where }),
        ]);
        const data = await Promise.all(
            rows.map(async (c) => ({
                ...c,
                _count: { vehicles: await this.vehicleRepo.count({ where: { carrierId: c.id } }) },
            })),
        );
        return { data, meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) } };
    }

    async findOne(id: number) {
        const carrier = await this.carrierRepo.findOne({
            where: { id },
            relations: ['organization', 'vehicles'],
        });
        if (!carrier) throw new NotFoundException(`Carrier ${id} not found`);
        return carrier;
    }

    async update(id: number, updateDto: UpdateCarrierDto) {
        await this.findOne(id);
        await this.carrierRepo.update(id, updateDto);
        return this.carrierRepo.findOne({ where: { id }, relations: ['organization'] });
    }

    async remove(id: number) {
        await this.findOne(id);
        return this.carrierRepo.remove(await this.carrierRepo.findOneByOrFail({ id }));
    }

    async updateZones(id: number, dto: UpdateCarrierZonesDto) {
        await this.findOne(id);
        await this.carrierRepo.update(id, { operatingZoneIds: dto.zoneIds });
        return this.carrierRepo.findOneBy({ id });
    }

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

        const allCarriers = await this.carrierRepo.find({
            where: { isActive: true },
            relations: ['organization'],
        });

        const eligible =
            zoneId != null
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
                modelNote:
                    'Ước lượng theo bảng phí carrier tự cấu hình (phí mở chuyến + phí/km + phí/kg vượt 1kg đầu) — không phải giá cam kết cuối cùng.',
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
