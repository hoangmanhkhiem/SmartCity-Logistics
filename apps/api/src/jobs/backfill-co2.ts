import { AppDataSource } from '../db/data-source';
import { Route } from '../db/entities';
import { calculateRouteCo2Grams } from '../http/middlewares/utils/co2';

/**
 * Tính lại estimatedCo2Grams cho các route đã completed.
 * Chạy: npm run backfill:co2
 */
async function main() {
    await AppDataSource.initialize();
    const routeRepo = AppDataSource.getRepository(Route);

    const routes = await routeRepo.find({
        where: { status: 'completed' },
        relations: ['vehicle', 'stops', 'stops.order'],
    });

    console.log(`🔎 Tìm thấy ${routes.length} route completed cần tính CO2...`);

    let updated = 0;
    for (const route of routes) {
        const totalWeightKg = route.stops
            .filter((s) => s.type === 'pickup')
            .reduce((sum, s) => sum + (s.order?.weightKg ?? 0), 0);

        const estimatedCo2Grams = calculateRouteCo2Grams({
            distanceKm: route.totalDistanceKm ?? 0,
            vehicleType: route.vehicle.type,
            isElectric: route.vehicle.isElectric,
            emissionFactor: route.vehicle.emissionFactor,
            totalWeightKg,
            vehicleCapacityKg: route.vehicle.capacity,
        });

        await routeRepo.update(route.id, { estimatedCo2Grams });
        console.log(
            `  ✅ Route ${route.code}: ${route.totalDistanceKm ?? 0}km, xe ${route.vehicle.type} → ${estimatedCo2Grams}g CO2`,
        );
        updated++;
    }

    console.log(`\n🌱 Đã cập nhật CO2 cho ${updated}/${routes.length} route.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        if (AppDataSource.isInitialized) await AppDataSource.destroy();
    });
