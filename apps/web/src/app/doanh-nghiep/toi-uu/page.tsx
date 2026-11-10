'use client';

import { useState } from 'react';
import { api } from '@/api';
import Map from '@/components/shared/map';
import { PageHead, StudioShell, orgNav } from '@/components/studio/shell';

type Plan = { totalKm?: number; durationMin?: number; co2eGrams?: number; congestionFactor?: number; orders?: number; onTimeRatio?: number };

export default function OptimizePage() {
    const [plan, setPlan] = useState<Plan | null>(null);
    const [message, setMessage] = useState('');
    const [avoid, setAvoid] = useState(true);
    const run = () => {
        setMessage('Đang lập lịch…');
        api.post('/phases/orders/simulate', { count: 12 }).catch(() => undefined).finally(() => {
            api.post('/phases/plans/solve').then((r) => { setPlan(r.data); setMessage(''); }).catch(() => setMessage('Cần đăng nhập nhân viên doanh nghiệp.'));
        });
    };
    return (
        <StudioShell group="DOANH NGHIỆP" role="Nhân viên" items={orgNav}>
            <PageHead title="Tối ưu tuyến · Ca trưa Hoàn Kiếm" />
            <div className="grid gap-4 px-6 pb-6 lg:grid-cols-[300px_1fr]">
                <section className="space-y-4 rounded-2xl bg-white p-4 text-sm">
                    <div><p className="font-semibold">1. Đơn hàng</p><p className="text-[#56635d]">24 đơn · 11:00–13:00</p><div className="mt-2 flex gap-2"><button type="button" className="rounded-lg border px-2 py-1">Nhập CSV</button><button type="button" className="rounded-lg border px-2 py-1">Tính giả lập</button></div></div>
                    <div><p className="font-semibold">2. Phương tiện</p><p>Xe máy điện × 2</p><p>Xe máy xăng × 3</p><p>Ba gác × 1</p></div>
                    <div>
                        <p className="font-semibold">3. Ràng buộc</p>
                        <label className="mt-1 flex justify-between">Tránh LEZ & đoạn cấm giờ <input type="checkbox" checked={avoid} onChange={() => setAvoid(!avoid)} /></label>
                        <label className="mt-1 flex justify-between">Không chờ quá 10 phút <input type="checkbox" defaultChecked /></label>
                        <label className="mt-1 flex justify-between">Ưu tiên điểm đỗ đã xác minh <input type="checkbox" defaultChecked /></label>
                    </div>
                    <button className="w-full rounded-xl bg-[#0e6e5c] py-2.5 font-semibold text-white" type="button" onClick={run}>Chạy tối ưu</button>
                    {message && <p>{message}</p>}
                </section>
                <div className="space-y-3">
                    <div className="h-80 overflow-hidden rounded-2xl bg-white"><Map className="h-full w-full" center={[105.852, 21.03]} zoom={14} showZonesAndRestrictions={avoid} /></div>
                    <p className="text-xs text-[#56635d]">Tuyến 1 · xe máy điện &nbsp; Tuyến 2 · xe máy xăng &nbsp; Kho xuất phát</p>
                    <p className="text-sm">Xong sau vài giây. {plan ? `${plan.orders} đơn, hệ số thời gian ${plan.congestionFactor}.` : '2 tuyến, 8 điểm được sang ca vì vướng cấm giờ.'}</p>
                    <table className="w-full rounded-2xl bg-white text-sm">
                        <thead className="text-left text-xs text-[#7b8781]"><tr><th className="px-3 py-2">Tuyến</th><th>Xe</th><th>Điểm dừng</th><th>Quãng đường</th><th>Thời gian</th><th>Tìm chỗ đỗ</th><th>CO₂e</th><th>Đúng giờ</th></tr></thead>
                        <tbody>
                            <tr className="border-t"><td className="px-3 py-2">Tuyến 1</td><td>Xe máy điện</td><td>10</td><td>{plan?.totalKm ?? '14,2'} km</td><td>{plan?.durationMin ?? '1 giờ 52 phút'}</td><td>25 phút</td><td>{plan?.co2eGrams ?? '[g]'}</td><td>10/10</td></tr>
                            <tr className="border-t"><td className="px-3 py-2">Tuyến 2</td><td>Xe máy xăng</td><td>8</td><td>17,2 km</td><td>2 giờ 40 phút</td><td>31 phút</td><td>[g]</td><td>7/8</td></tr>
                        </tbody>
                    </table>
                    <div className="flex gap-2 text-sm">
                        <button type="button" className="rounded-lg bg-[#14352c] px-3 py-2 text-white">Lưu kế hoạch</button>
                        <button type="button" className="rounded-lg border bg-white px-3 py-2">So sánh A/B</button>
                        <button type="button" className="rounded-lg border bg-white px-3 py-2">Xuất GeoJSON / CSV</button>
                    </div>
                </div>
            </div>
        </StudioShell>
    );
}
