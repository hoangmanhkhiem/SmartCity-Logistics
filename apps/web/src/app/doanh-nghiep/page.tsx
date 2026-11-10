'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/api';
import Map from '@/components/shared/map';
import { PageHead, StudioShell, orgNav } from '@/components/studio/shell';
import type { GeoJsonFeatureCollection } from '@/components/shared/map';

const kpis = [
    ['Đơn đã lập tuyến', '1.240', 'từ kế hoạch'],
    ['Km chạy rỗng', '14%', 'thấp hơn TB ngành 3 điểm'],
    ['CO₂e mỗi đơn', '182 g', 'cao hơn TB ngành 9%'],
    ['Đúng giờ (đúng giờ)', '91%', 'đúng TB ngành'],
];

export default function OrgOverviewPage() {
    const [congestion, setCongestion] = useState<GeoJsonFeatureCollection | null>(null);
    useEffect(() => { api.get('/traffic/segments').then((r) => setCongestion(r.data)).catch(() => undefined); }, []);
    return (
        <StudioShell group="DOANH NGHIỆP" role="Quản trị DN" items={orgNav}>
            <PageHead title="Tổng quan" extra={<span className="text-sm text-[#56635d]">[Tên doanh nghiệp] · Quản trị DN</span>} />
            <div className="grid gap-4 px-6 pb-6 xl:grid-cols-[1fr_300px]">
                <div className="space-y-4">
                    <div className="grid gap-3 md:grid-cols-4">
                        {kpis.map(([label, value, note]) => (
                            <article key={label} className="rounded-2xl bg-white p-4"><p className="text-xs text-[#7b8781]">{label}</p><p className="mt-1 text-2xl font-semibold">{value}</p><p className="text-xs text-[#0e6e5c]">{note}</p></article>
                        ))}
                    </div>
                    <section className="rounded-2xl bg-white p-4 text-sm">
                        <div className="flex items-center justify-between"><h2 className="font-semibold">So sánh với trung bình ngành</h2><button type="button" className="rounded-lg border px-3 py-1 text-xs">Tải báo cáo PDF</button></div>
                        <table className="mt-3 w-full">
                            <thead className="text-left text-xs text-[#7b8781]"><tr><th className="py-2">Chỉ số</th><th>DN của bạn</th><th>TB ngành</th><th>Gợi ý</th></tr></thead>
                            <tbody>
                                <tr className="border-t"><td className="py-2">Tỷ lệ xe điện</td><td>12%</td><td>21%</td><td>Mở phòng chuyển 20% xe sang điện</td></tr>
                                <tr className="border-t"><td className="py-2">Thời gian tìm chỗ đỗ / điểm</td><td>6,5 phút</td><td>5,8 phút</td><td>Dùng lớp điểm đỗ đã xác minh</td></tr>
                                <tr className="border-t"><td className="py-2">Đơn bị ảnh hưởng cấm giờ</td><td>8%</td><td>11%</td><td>—</td></tr>
                            </tbody>
                        </table>
                    </section>
                    <section className="rounded-2xl bg-white p-4">
                        <div className="mb-2 flex justify-between text-sm"><h2 className="font-semibold">Kho và điểm của doanh nghiệp</h2><Link href="/logistics/facilities" className="text-[#0e6e5c]">Quản lý</Link></div>
                        <div className="h-64 overflow-hidden rounded-xl"><Map className="h-full w-full" center={[105.84, 21.03]} zoom={13} congestionGeoJson={congestion} /></div>
                    </section>
                </div>
                <aside className="space-y-3">
                    <section className="rounded-2xl bg-white p-4 text-sm">
                        <div className="flex justify-between"><h2 className="font-semibold">Hồ sơ đối tác</h2><span className="text-xs text-[#7b8781]">3/5</span></div>
                        <ul className="mt-3 space-y-2 text-[#3f4a45]">
                            <li>● Mô hình giao chặng cuối</li>
                            <li>● Quy mô và cấu đội xe</li>
                            <li>○ Kho, điểm trung chuyển</li>
                            <li>○ Khung giờ cao điểm</li>
                            <li>○ Phạm vi phục vụ</li>
                        </ul>
                        <Link href="/studio/doi-tac" className="mt-4 block rounded-lg bg-[#0e6e5c] py-2 text-center text-white">Hoàn thiện hồ sơ</Link>
                        <p className="mt-3 text-xs text-[#7b8781]">Ẩn tên DN trên website công khai <span className="float-right">on</span></p>
                    </section>
                    <section className="rounded-2xl bg-white p-4 text-sm">
                        <div className="flex justify-between"><h2 className="font-semibold">Kế hoạch tuyến gần đây</h2><Link href="/doanh-nghiep/toi-uu" className="text-xs text-[#0e6e5c]">Tất cả</Link></div>
                        <ul className="mt-2 space-y-2">
                            <li className="flex justify-between"><span>Ca trưa · Hoàn Kiếm</span><span className="text-[#0e6e5c]">Đang chạy</span></li>
                            <li className="flex justify-between"><span>Ca chiều · Cầu Giấy</span><span>Xong</span></li>
                            <li className="flex justify-between"><span>So sánh A/B · LEZ</span><span>Xong</span></li>
                        </ul>
                    </section>
                </aside>
            </div>
        </StudioShell>
    );
}
