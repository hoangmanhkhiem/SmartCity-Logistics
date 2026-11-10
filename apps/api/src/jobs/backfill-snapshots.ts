import { AppDataSource } from '../db/data-source';
import {
    AnalyticsSnapshot,
    Carrier,
    Order,
    Route,
    Stop,
    Telemetry,
    Vehicle,
} from '../db/entities';
import { AnalyticsService } from '../http/routes/analytics/analytics.service';

/**
 * Tạo/cập nhật analytics_snapshots cho mỗi ngày từ order/route đầu tiên tới hôm nay.
 * Chạy: npm run backfill:snapshots
 */
async function main() {
    await AppDataSource.initialize();

    const analyticsService = new AnalyticsService(
        AppDataSource.getRepository(Order),
        AppDataSource.getRepository(Vehicle),
        AppDataSource.getRepository(Route),
        AppDataSource.getRepository(Telemetry),
        AppDataSource.getRepository(Carrier),
        AppDataSource.getRepository(AnalyticsSnapshot),
        AppDataSource.getRepository(Stop),
    );

    const [earliestOrder, earliestRoute] = await Promise.all([
        AppDataSource.getRepository(Order).findOne({
            order: { createdAt: 'ASC' },
            select: ['createdAt'],
        }),
        AppDataSource.getRepository(Route).findOne({
            order: { createdAt: 'ASC' },
            select: ['createdAt'],
        }),
    ]);

    const candidateDates = [earliestOrder?.createdAt, earliestRoute?.createdAt].filter(
        (d): d is Date => d != null,
    );
    if (!candidateDates.length) {
        console.log('⚠️  Chưa có order/route nào trong DB — không có gì để backfill.');
        return;
    }

    const startDate = new Date(Math.min(...candidateDates.map((d) => d.getTime())));
    const today = new Date();

    const days: Date[] = [];
    const cursor = new Date(Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()));
    const end = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
    while (cursor.getTime() <= end.getTime()) {
        days.push(new Date(cursor));
        cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    console.log(
        `🔎 Backfill snapshot cho ${days.length} ngày (${days[0].toISOString().slice(0, 10)} → ${days[days.length - 1].toISOString().slice(0, 10)})...`,
    );

    for (const day of days) {
        const result = await analyticsService.createSnapshot(day);
        console.log(
            `  ✅ ${day.toISOString().slice(0, 10)}: ${result.count} snapshot (toàn nền tảng + từng carrier)`,
        );
    }

    console.log(`\n🌱 Hoàn tất backfill snapshot cho ${days.length} ngày.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        if (AppDataSource.isInitialized) await AppDataSource.destroy();
    });
