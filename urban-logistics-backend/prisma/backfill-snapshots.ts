import { PrismaService } from '../src/prisma/prisma.service';
import { AnalyticsService } from '../src/analytics/analytics.service';

const prisma = new PrismaService();
const analyticsService = new AnalyticsService(prisma);

/**
 * Tạo/cập nhật analytics_snapshots cho mỗi ngày từ order/route đầu tiên tới hôm nay.
 * Biểu đồ "Xu hướng đơn hàng & CO2" (GET /analytics/trend) chỉ đọc từ bảng này — nó không
 * tự tính từ orders/routes, nên nếu chưa có snapshot thì biểu đồ luôn rỗng dù routes đã có
 * estimatedCo2Grams (đó là lý do npm run backfill:co2 không tự làm biểu đồ có dữ liệu).
 *
 * Chạy: npm run backfill:snapshots
 */
async function main() {
    await prisma.$connect();

    const [earliestOrder, earliestRoute] = await Promise.all([
        prisma.order.findFirst({ orderBy: { createdAt: 'asc' }, select: { createdAt: true } }),
        prisma.route.findFirst({ orderBy: { createdAt: 'asc' }, select: { createdAt: true } }),
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

    console.log(`🔎 Backfill snapshot cho ${days.length} ngày (${days[0].toISOString().slice(0, 10)} → ${days[days.length - 1].toISOString().slice(0, 10)})...`);

    for (const day of days) {
        const result = await analyticsService.createSnapshot(day);
        console.log(`  ✅ ${day.toISOString().slice(0, 10)}: ${result.count} snapshot (toàn nền tảng + từng carrier)`);
    }

    console.log(`\n🌱 Hoàn tất backfill snapshot cho ${days.length} ngày.`);
}

main()
    .catch((e) => {
        console.error('❌ Backfill snapshot thất bại:', e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
