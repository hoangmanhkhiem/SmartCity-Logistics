'use client';

import { useRef, useState } from 'react';
import { api } from '@/api';
import Map from '@/components/shared/map';
import { PageHead, StudioShell, orgNav } from '@/components/studio/shell';

type Plan = {
    totalKm?: number;
    durationMin?: number;
    co2eGrams?: number;
    congestionFactor?: number;
    orders?: number;
    onTimeRatio?: number;
    warnings?: Array<{ message?: string }>;
    stops?: Array<{ sequence: number; lat?: number; lon?: number }>;
};

export default function OptimizePage() {
    const csvRef = useRef<HTMLInputElement>(null);
    const [plan, setPlan] = useState<Plan | null>(null);
    const [compare, setCompare] = useState<Plan | null>(null);
    const [message, setMessage] = useState('');
    const [avoid, setAvoid] = useState(true);
    const [waitCap, setWaitCap] = useState(true);
    const [preferPark, setPreferPark] = useState(true);

    const run = (count = 12) => {
        setMessage('Đang lập lịch…');
        api.post('/phases/orders/simulate', { count }).catch(() => undefined).finally(() => {
            api.post('/phases/plans/solve').then((r) => { setPlan(r.data); setMessage(''); }).catch(() => setMessage('Cần đăng nhập nhân viên doanh nghiệp.'));
        });
    };

    const save = () => {
        if (!plan) { setMessage('Chạy tối ưu trước khi lưu.'); return; }
        api.post('/plans', { solverParams: { avoid, waitCap, preferPark }, result: plan, status: 'done' })
            .then((r) => setMessage(`Đã lưu kế hoạch #${r.data.id}`))
            .catch(() => setMessage('Không lưu được kế hoạch.'));
    };

    const exportGeo = () => {
        const features = (plan?.stops ?? []).map((s) => ({
            type: 'Feature',
            properties: { sequence: s.sequence },
            geometry: { type: 'Point', coordinates: [s.lon ?? 105.85, s.lat ?? 21.03] },
        }));
        const blob = new Blob([JSON.stringify({ type: 'FeatureCollection', features }, null, 2)], { type: 'application/geo+json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'tuyen.geojson';
        a.click();
        const csv = ['seq,lat,lon', ...(plan?.stops ?? []).map((s) => `${s.sequence},${s.lat},${s.lon}`)].join('\n');
        const b = document.createElement('a');
        b.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
        b.download = 'tuyen.csv';
        b.click();
    };

    const importCsv = async (file: File) => {
        setMessage('Đang nhập CSV…');
        try {
            await api.post('/phases/orders/import', { csv: await file.text() });
            const r = await api.post('/phases/plans/solve');
            setPlan(r.data);
            setMessage('Đã lập tuyến từ CSV.');
        } catch {
            setMessage('CSV không hợp lệ hoặc cần đăng nhập.');
        }
    };

    return (
        <StudioShell group="DOANH NGHIỆP" role="Nhân viên" items={orgNav}>
            <PageHead title="Tối ưu tuyến" />
            <div className="grid gap-4 px-6 pb-6 lg:grid-cols-[300px_1fr]">
                <section className="space-y-4 rounded-2xl bg-white p-4 text-sm">
                    <div>
                        <p className="font-semibold">1. Đơn hàng</p>
                        <p className="text-[#56635d]">{plan?.orders ?? 0} đơn trong lần chạy gần nhất</p>
                        <div className="mt-2 flex gap-2">
                            <input ref={csvRef} type="file" accept=".csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) importCsv(f); e.target.value = ''; }} />
                            <button type="button" className="rounded-lg border px-2 py-1" onClick={() => csvRef.current?.click()}>Nhập CSV</button>
                            <button type="button" className="rounded-lg border px-2 py-1" onClick={() => run(12)}>Tính giả lập</button>
                        </div>
                    </div>
                    <div>
                        <p className="font-semibold">2. Ràng buộc</p>
                        <label className="mt-1 flex justify-between">Tránh LEZ & đoạn cấm giờ <input type="checkbox" checked={avoid} onChange={() => setAvoid(!avoid)} /></label>
                        <label className="mt-1 flex justify-between">Không chờ quá 10 phút <input type="checkbox" checked={waitCap} onChange={() => setWaitCap(!waitCap)} /></label>
                        <label className="mt-1 flex justify-between">Ưu tiên điểm đỗ đã xác minh <input type="checkbox" checked={preferPark} onChange={() => setPreferPark(!preferPark)} /></label>
                    </div>
                    <button className="w-full rounded-xl bg-[#0e6e5c] py-2.5 font-semibold text-white" type="button" onClick={() => run(24)}>Chạy tối ưu</button>
                    {message && <p>{message}</p>}
                    {plan?.warnings?.length ? <p className="text-xs text-[#8a5a12]">{plan.warnings[0].message}</p> : null}
                </section>
                <div className="space-y-3">
                    <div className="h-80 overflow-hidden rounded-2xl bg-white"><Map className="h-full w-full" center={[105.852, 21.03]} zoom={14} showZonesAndRestrictions={avoid} /></div>
                    <table className="w-full rounded-2xl bg-white text-sm">
                        <thead className="text-left text-xs text-[#7b8781]"><tr><th className="px-3 py-2">Kịch bản</th><th>Đơn</th><th>Quãng đường</th><th>Thời gian</th><th>CO₂e</th><th>Đúng giờ</th></tr></thead>
                        <tbody>
                            <tr className="border-t"><td className="px-3 py-2">Hiện tại</td><td>{plan?.orders ?? '—'}</td><td>{plan?.totalKm ?? '—'} km</td><td>{plan?.durationMin ?? '—'} phút</td><td>{plan?.co2eGrams ?? '—'}</td><td>{plan ? `${Math.round((plan.onTimeRatio ?? 0) * 100)}%` : '—'}</td></tr>
                            {compare && <tr className="border-t"><td className="px-3 py-2">A/B (không tránh LEZ)</td><td>{compare.orders}</td><td>{compare.totalKm} km</td><td>{compare.durationMin} phút</td><td>{compare.co2eGrams}</td><td>{Math.round((compare.onTimeRatio ?? 0) * 100)}%</td></tr>}
                        </tbody>
                    </table>
                    <div className="flex flex-wrap gap-2 text-sm">
                        <button type="button" className="rounded-lg bg-[#14352c] px-3 py-2 text-white" onClick={save}>Lưu kế hoạch</button>
                        <button type="button" className="rounded-lg border bg-white px-3 py-2" onClick={() => {
                            setAvoid(false);
                            api.post('/phases/plans/solve').then((r) => setCompare(r.data)).catch(() => setMessage('Không so sánh được.'));
                        }}>So sánh A/B</button>
                        <button type="button" className="rounded-lg border bg-white px-3 py-2" onClick={exportGeo}>Xuất GeoJSON / CSV</button>
                    </div>
                </div>
            </div>
        </StudioShell>
    );
}
