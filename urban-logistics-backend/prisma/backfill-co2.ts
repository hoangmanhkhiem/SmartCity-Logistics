import { PrismaClient } from '@prisma/client';
import { calculateRouteCo2Grams } from '../src/common/utils/co2';

const prisma = new PrismaClient();

/**
 * Tính lại estimatedCo2Grams cho các route đã completed — dùng khi:
 * - Route cũ được tạo trước khi có logic tính CO2 (estimatedCo2Grams đang null)
 * - Muốn tính lại toàn bộ sau khi chỉnh hệ số phát thải trong co2.ts
 * Không đụng tới route planned/in_progress/cancelled (chưa có totalDistanceKm/vehicle cố định).
 *
 * Chạy: npm run backfill:co2
 */
async function main() {
    const routes = await prisma.route.findMany({
        where: { status: 'completed' },
        include: {
            vehicle: true,
            stops: { where: { type: 'pickup' }, include: { order: { select: { weightKg: true } } } },
        },
    });

    console.log(`🔎 Tìm thấy ${routes.length} route completed cần tính CO2...`);

    let updated = 0;
    for (const route of routes) {
        const totalWeightKg = route.stops.reduce((sum, s) => sum + (s.order.weightKg ?? 0), 0);

        const estimatedCo2Grams = calculateRouteCo2Grams({
            distanceKm: route.totalDistanceKm ?? 0,
            vehicleType: route.vehicle.type,
            isElectric: route.vehicle.isElectric,
            emissionFactor: route.vehicle.emissionFactor,
            totalWeightKg,
            vehicleCapacityKg: route.vehicle.capacity,
        });

        await prisma.route.update({
            where: { id: route.id },
            data: { estimatedCo2Grams },
        });

        console.log(`  ✅ Route ${route.code}: ${route.totalDistanceKm ?? 0}km, xe ${route.vehicle.type} → ${estimatedCo2Grams}g CO2`);
        updated++;
    }

    console.log(`\n🌱 Đã cập nhật CO2 cho ${updated}/${routes.length} route.`);
}

main()
    .catch((e) => {
        console.error('❌ Backfill CO2 thất bại:', e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
