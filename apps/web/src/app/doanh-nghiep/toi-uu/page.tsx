'use client';

import { useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { api } from '@/api';
import Map from '@/components/shared/map';
import { PageHead, StudioShell, orgNav } from '@/components/studio/shell';
import { DataTable, type Column } from '@/components/ui';

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

    const stopMarkers = (plan?.stops ?? [])
        .filter((s) => s.lat != null && s.lon != null)
        .map((s) => ({
            id: `stop-${s.sequence}`,
            coordinates: [s.lon as number, s.lat as number] as [number, number],
            type: 'destination' as const,
            label: `Điểm ${s.sequence}`,
        }));

    return (
        <StudioShell group="DOANH NGHIỆP" role="Nhân viên" items={orgNav}>
            <PageHead
                title="Tối ưu tuyến"
                eyebrow="TRUNG TÂM ĐIỀU HÀNH"
                extra={<span className="cq-live"><i /> Dữ liệu trực tiếp</span>}
            />
            <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
                <section className="h-fit space-y-5 rounded-[16px] border border-[#e6ebf2] bg-white p-5 shadow-[0_8px_30px_rgba(11,27,58,0.045)]">
                    <div>
                        <div className="flex items-start gap-3">
                            <span className="grid size-7 place-items-center rounded-full bg-[#087a69] text-[12px] font-bold text-white">1</span>
                            <div>
                                <p className="font-bold text-[#152542]">Đơn hàng</p>
                                <p className="text-[13px] text-[#748298]">{plan?.orders ?? 0} đơn đang chờ lập tuyến</p>
                            </div>
                        </div>
                        <div className="mt-3 rounded-[12px] border border-dashed border-[#d5dee8] bg-[#f7f9fc] px-4 py-5 text-center">
                            <p className="text-sm font-semibold text-[#33425c]">Nhập danh sách đơn hàng</p>
                            <p className="mt-0.5 text-[11px] text-[#8490a5]">CSV, XLSX · tối đa 10 MB</p>
                            <input ref={csvRef} type="file" accept=".csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) importCsv(f); e.target.value = ''; }} />
                            <button type="button" className="mt-3 h-9 rounded-[11px] border border-[#dce3ed] bg-white px-4 text-sm font-semibold" onClick={() => csvRef.current?.click()}>Chọn tệp</button>
                        </div>
                    </div>
                    <div>
                        <div className="flex items-start gap-3">
                            <span className="grid size-7 place-items-center rounded-full bg-[#087a69] text-[12px] font-bold text-white">2</span>
                            <div>
                                <p className="font-bold text-[#152542]">Ràng buộc</p>
                                <p className="text-[13px] text-[#748298]">Thiết lập điều kiện tối ưu</p>
                            </div>
                        </div>
                        <label className="mt-3 flex items-center gap-2 text-sm text-[#33425c]">
                            <input type="checkbox" checked={avoid} onChange={() => setAvoid(!avoid)} /> Né zone, đường cấm & điểm ùn tắc
                        </label>
                        <label className="mt-2 flex items-center gap-2 text-sm text-[#33425c]">
                            <input type="checkbox" checked={waitCap} onChange={() => setWaitCap(!waitCap)} /> Không chờ quá 10 phút
                        </label>
                        <label className="mt-2 flex items-center gap-2 text-sm text-[#33425c]">
                            <input type="checkbox" checked={preferPark} onChange={() => setPreferPark(!preferPark)} /> Ưu tiên điểm đỗ đã xác minh
                        </label>
                    </div>
                    <button className="nc-cta" type="button" onClick={() => run(24)}>
                        Chạy tối ưu <ArrowRight size={16} className="ml-1 inline" />
                    </button>
                    {message && <p className="text-sm">{message}</p>}
                    {plan?.warnings?.length ? <p className="text-xs text-[#8a5a12]">{plan.warnings[0].message}</p> : null}
                </section>

                <div className="space-y-3">
                    <div className="dn-map overflow-hidden rounded-[16px] bg-white shadow-[0_8px_30px_rgba(11,27,58,0.045)]">
                        <Map className="h-full w-full" center={[105.852, 21.03]} zoom={14} showZonesAndRestrictions={avoid} markers={stopMarkers} />
                    </div>
                    <div className="overflow-hidden rounded-[16px] border border-[#e6ebf2] bg-white">
                        <DataTable
                            pagination={false}
                            data={[
                                {
                                    id: 'current',
                                    scenario: 'Hiện tại',
                                    orders: plan?.orders ?? '—',
                                    km: plan?.totalKm != null ? `${plan.totalKm} km` : '—',
                                    duration: plan?.durationMin != null ? `${plan.durationMin} phút` : '—',
                                    co2: plan?.co2eGrams ?? '—',
                                    onTime: plan ? `${Math.round((plan.onTimeRatio ?? 0) * 100)}%` : '—',
                                },
                                ...(compare ? [{
                                    id: 'ab',
                                    scenario: 'A/B (không tránh LEZ)',
                                    orders: compare.orders ?? '—',
                                    km: `${compare.totalKm} km`,
                                    duration: `${compare.durationMin} phút`,
                                    co2: compare.co2eGrams ?? '—',
                                    onTime: `${Math.round((compare.onTimeRatio ?? 0) * 100)}%`,
                                }] : []),
                            ]}
                            columns={[
                                { key: 'scenario', header: 'Kịch bản' },
                                { key: 'orders', header: 'Đơn' },
                                { key: 'km', header: 'Quãng đường' },
                                { key: 'duration', header: 'Thời gian' },
                                { key: 'co2', header: 'CO₂e' },
                                { key: 'onTime', header: 'Đúng giờ' },
                            ] satisfies Column<{ id: string; scenario: string; orders: string | number; km: string; duration: string; co2: string | number; onTime: string }>[]}
                        />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button type="button" className="h-10 rounded-[11px] bg-[#0b1b3a] px-4 text-sm font-semibold text-white" onClick={save}>Lưu kế hoạch</button>
                        <button type="button" className="h-10 rounded-[11px] border border-[#dce3ed] bg-white px-4 text-sm font-semibold" onClick={() => {
                            setAvoid(false);
                            api.post('/phases/plans/solve').then((r) => setCompare(r.data)).catch(() => setMessage('Không so sánh được.'));
                        }}>So sánh A/B</button>
                        <button type="button" className="h-10 rounded-[11px] border border-[#dce3ed] bg-white px-4 text-sm font-semibold" onClick={exportGeo}>Xuất GeoJSON / CSV</button>
                    </div>
                </div>
            </div>
        </StudioShell>
    );
}
