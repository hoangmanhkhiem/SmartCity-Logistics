import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { haversineKm } from '../common/utils/geo';

@Injectable()
export class QuotesService {
    constructor(private readonly prisma: PrismaService) {}

    /**
     * So sánh giá ước tính giữa các carrier (mô hình đơn giản — thay bằng API GHN/GHTK thật sau).
     */
    async compareCarriers(params: {
        pickupLat: number;
        pickupLon: number;
        deliveryLat: number;
        deliveryLon: number;
        weightKg?: number;
    }) {
        const distanceKm = haversineKm(params.pickupLat, params.pickupLon, params.deliveryLat, params.deliveryLon);
        const w = params.weightKg ?? 1;

        const carriers = await this.prisma.carrier.findMany({
            where: { isActive: true },
            take: 12,
            orderBy: { name: 'asc' },
            include: { organization: true },
        });

        const quotes = carriers.map((c, i) => {
            const base = 12000 + i * 800;
            const perKm = 3500 + (c.vehicleCount ?? 100) % 5 * 200;
            const perKg = 1800;
            const estimateVnd = Math.round(base + distanceKm * perKm + w * perKg);
            const etaMin = Math.round(25 + distanceKm * 3.5 + (c.warehouseCount ?? 5));
            return {
                carrierId: c.id,
                carrierName: c.name,
                organization: c.organization?.name,
                estimatedFeeVnd: estimateVnd,
                estimatedEtaMinutes: etaMin,
                modelNote: 'Ước lượng nội bộ (không phải giá API hãng)',
            };
        });

        quotes.sort((a, b) => a.estimatedFeeVnd - b.estimatedFeeVnd);

        return {
            distanceKm: Math.round(distanceKm * 1000) / 1000,
            weightKg: w,
            quotes,
        };
    }
}
