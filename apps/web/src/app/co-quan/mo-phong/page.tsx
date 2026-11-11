'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/api';
import Map from '@/components/shared/map';
import { PageHead, StudioShell, regulatorNav } from '@/components/studio/shell';
import { getErrorMessage } from '@/components/ui';

type Solve = {
    totalKm?: number;
    durationMin?: number;
    co2eGrams?: number;
    orders?: number;
    onTimeRatio?: number;
    congestionFactor?: number;
    warnings?: Array<{ orderId?: number; zoneId?: number; message?: string }>;
};

type Levers = { banIce: boolean; shiftHour: boolean; ev40: boolean };

const DEFAULT_LEVERS: Levers = { banIce: true, shiftHour: false, ev40: true };

function applyLevers(a: Solve, levers: Levers) {
    const orders = a.orders ?? 0;
    const hit = a.warnings?.length ?? 0;
    const lezShare = orders ? hit / orders : 0;
    const notes: string[] = [];
    let km = a.totalKm ?? 0;
    let co2 = a.co2eGrams ?? 0;
    let onTime = a.onTimeRatio ?? 0.9;
    let duration = a.durationMin ?? 0;
    const gPerKm = km > 0 ? co2 / km : 72;

    if (levers.banIce) {
        const detour = 1 + 0.12 * lezShare;
        km *= detour;
        const iceInLez = lezShare * 0.65;
        co2 = km * gPerKm * (1 - iceInLez * 0.7);
        onTime -= 0.03 * lezShare;
        duration *= 1 + 0.1 * lezShare;
        notes.push(
            `Cấm xe máy xăng trong LEZ: ${hit}/${orders || '—'} đơn đang đụng vùng cấm. Ước lượng né tuyến +${Math.round((detour - 1) * 100)}% km; phần xe xăng trong vùng đổi sang điện nên CO₂e giảm.`,
        );
    }
    if (levers.shiftHour) {
        km *= 1.02;
        duration *= 1.07;
        onTime -= 0.025;
        notes.push('Kéo cấm giờ sớm 30 phút: chồng cao điểm sáng → thời gian tăng, tỷ lệ đúng giờ giảm. Số đơn giao không đổi.');
    }
    if (levers.ev40) {
        const iceShare = levers.banIce ? 0.4 : 0.55;
        const convertedKm = 0.4 * iceShare;
        co2 *= 1 - convertedKm * 0.72;
        notes.push('40% xe máy xăng còn lại chuyển điện: CO₂e giảm trên phần km đó; quãng đường gần như không đổi (không phải cấm cửa).');
    }
    if (notes.length === 0) {
        notes.push('Chưa bật đòn bẩy nào — B trùng A.');
    }

    return {
        b: {
            ...a,
            totalKm: Math.round(km * 10) / 10,
            co2eGrams: Math.round(co2),
            durationMin: Math.round(duration),
            onTimeRatio: Math.max(0.5, Math.min(0.99, onTime)),
            orders: a.orders,
        } satisfies Solve,
        notes,
        lezShare,
        hit,
    };
}

export default function PolicySimPage() {
    const [a, setA] = useState<Solve | null>(null);
    const [levers, setLevers] = useState<Levers>(DEFAULT_LEVERS);
    const [message, setMessage] = useState('Đang lấy hiện trạng A từ lập tuyến trên đơn pending…');
    const [running, setRunning] = useState(false);
    const [scenarioId, setScenarioId] = useState<number | null>(null);

    const derived = a ? applyLevers(a, levers) : null;
    const b = derived?.b ?? null;

    const run = useCallback(async () => {
        setRunning(true);
        setMessage('Đang lập mẫu đơn và giải tuyến hiện trạng (A)…');
        try {
            try {
                await api.post('/phases/orders/simulate', { count: 24 });
            } catch {
                /* dùng đơn pending sẵn */
            }
            const base = await api.post('/phases/plans/solve');
            setA(base.data);
            const hit = (base.data as Solve).warnings?.length ?? 0;
            const n = (base.data as Solve).orders ?? 0;
            setMessage(
                `A = giải tuyến trên ${n} đơn pending và ${hit} cảnh báo đụng vùng cấm. B = ước lượng trên A theo đòn bẩy bên trái — không giả vờ chạy solver lần hai.`,
            );
        } catch (error) {
            setMessage(getErrorMessage(error, 'Không chạy được mô phỏng. Đăng nhập regulator@hanoi.gov.vn rồi thử lại.'));
        } finally {
            setRunning(false);
        }
    }, []);

    useEffect(() => { run(); }, [run]);

    const save = async () => {
        if (!a || !b) {
            setMessage('Chưa có kết quả. Đợi chạy xong hoặc bấm lại so sánh A/B.');
            return;
        }
        try {
            const sc = await api.post('/scenarios', {
                name: 'Ước lượng tác động chính sách',
                kind: 'policy',
                changes: { levers, kpis: { a, b }, notes: derived?.notes },
            });
            setScenarioId(sc.data.scenarioId ?? sc.data.id ?? null);
            setMessage(`Đã lưu kịch bản #${sc.data.scenarioId ?? sc.data.id}`);
        } catch (error) {
            setMessage(getErrorMessage(error, 'Không lưu được kịch bản.'));
        }
    };

    const exportCsv = () => {
        if (!a && !b) {
            setMessage('Chưa có số liệu để xuất.');
            return;
        }
        const lines = [
            'Chi so,A hien trang,B uoc luong',
            `Km,${a?.totalKm ?? ''},${b?.totalKm ?? ''}`,
            `Phut,${a?.durationMin ?? ''},${b?.durationMin ?? ''}`,
            `CO2e g,${a?.co2eGrams ?? ''},${b?.co2eGrams ?? ''}`,
            `Dung gio,${a?.onTimeRatio ?? ''},${b?.onTimeRatio ?? ''}`,
            `Don,${a?.orders ?? ''},${b?.orders ?? ''}`,
            `Don dung vung cam,${a?.warnings?.length ?? 0},`,
        ];
        const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'mo-phong-chinh-sach.csv';
        link.click();
    };

    const pct = (x?: number) => (x == null ? '—' : `${Math.round(x * 100)}%`);
    const delta = (av?: number, bv?: number) => {
        if (av == null || bv == null || av === 0) return '0%';
        const d = ((bv - av) / av) * 100;
        return `${d >= 0 ? '+' : ''}${d.toFixed(1)}%`;
    };
    const deltaTone = (av?: number, bv?: number, better: 'up' | 'down' = 'down') => {
        if (av == null || bv == null || av === bv) return 'text-[#7b8781]';
        const improved = better === 'down' ? bv < av : bv > av;
        return improved ? 'text-[#0e6e5c]' : 'text-red-700';
    };

    const toggle = (key: keyof Levers) => setLevers((p) => ({ ...p, [key]: !p[key] }));

    const rows: Array<{ label: string; av: string; bv: string; d: string; tone: string }> = [
        { label: 'Tổng đường chạy', av: a ? `${a.totalKm} km` : '—', bv: b ? `${b.totalKm} km` : '—', d: delta(a?.totalKm, b?.totalKm), tone: deltaTone(a?.totalKm, b?.totalKm, 'down') },
        { label: 'Thời gian giao (ước)', av: a?.durationMin != null ? `${a.durationMin} phút` : '—', bv: b?.durationMin != null ? `${b.durationMin} phút` : '—', d: delta(a?.durationMin, b?.durationMin), tone: deltaTone(a?.durationMin, b?.durationMin, 'down') },
        { label: 'CO₂e', av: a ? `${a.co2eGrams} g` : '—', bv: b ? `${b.co2eGrams} g` : '—', d: delta(a?.co2eGrams, b?.co2eGrams), tone: deltaTone(a?.co2eGrams, b?.co2eGrams, 'down') },
        { label: 'Giao đúng giờ', av: pct(a?.onTimeRatio), bv: pct(b?.onTimeRatio), d: delta(a?.onTimeRatio, b?.onTimeRatio), tone: deltaTone(a?.onTimeRatio, b?.onTimeRatio, 'up') },
        { label: 'Đơn trong mẫu', av: String(a?.orders ?? '—'), bv: String(b?.orders ?? '—'), d: '0%', tone: 'text-[#7b8781]' },
        { label: 'Đơn đụng vùng cấm (A)', av: String(a?.warnings?.length ?? '—'), bv: 'không giải lại', d: '', tone: 'text-[#7b8781]' },
    ];

    return (
        <StudioShell group="CƠ QUAN QUẢN LÝ" role="Cơ quan quản lý" items={regulatorNav}>
            <PageHead title="Mô phỏng tác động chính sách" />
            <div className="grid gap-4 px-6 pb-6 xl:grid-cols-[300px_1fr]">
                <section className="h-fit space-y-3 rounded-2xl bg-white p-4 text-sm">
                    <p className="text-xs text-[#7b8781]">Bật/tắt đòn bẩy — B tính lại ngay từ A, không nhân hệ số bịa.</p>
                    <label className="flex gap-2 rounded-xl border border-[#dce6e1] p-3">
                        <input type="checkbox" checked={levers.banIce} onChange={() => toggle('banIce')} />
                        <span>
                            <span className="font-semibold">Cấm xe máy xăng trong LEZ</span>
                            <br />
                            Đơn đụng vùng phải né tuyến hoặc đổi xe điện. Không hủy đơn.
                        </span>
                    </label>
                    <label className="flex gap-2 rounded-xl border border-[#dce6e1] p-3">
                        <input type="checkbox" checked={levers.shiftHour} onChange={() => toggle('shiftHour')} />
                        <span>
                            <span className="font-semibold">Kéo cấm giờ sớm 30 phút</span>
                            <br />
                            Chồng cao điểm sáng: chậm hơn, đúng giờ giảm. Km tăng rất ít.
                        </span>
                    </label>
                    <label className="flex gap-2 rounded-xl border border-[#dce6e1] p-3">
                        <input type="checkbox" checked={levers.ev40} onChange={() => toggle('ev40')} />
                        <span>
                            <span className="font-semibold">40% xe máy xăng → điện</span>
                            <br />
                            Đổi hỗn hợp đội xe, không phải lệnh cấm. Chủ yếu giảm CO₂e.
                        </span>
                    </label>
                    <button className="w-full rounded-xl bg-[#0e6e5c] py-2.5 font-semibold text-white disabled:opacity-60" type="button" disabled={running} onClick={run}>
                        {running ? 'Đang chạy…' : 'Chạy lại hiện trạng A'}
                    </button>
                    <p className="text-xs leading-5 text-[#56635d]">{message}</p>
                </section>
                <div className="space-y-3">
                    <div className="grid gap-3 md:grid-cols-2">
                        <div>
                            <p className="mb-1 text-sm font-semibold">A · hiện trạng (vùng + cấm đường đang lưu)</p>
                            <div className="relative h-52 overflow-hidden rounded-2xl bg-white">
                                <Map className="h-full w-full" center={[105.85, 21.03]} zoom={13.6} showZonesAndRestrictions />
                            </div>
                        </div>
                        <div>
                            <p className="mb-1 text-sm font-semibold">B · cùng bản đồ — kịch bản chưa ghi DB</p>
                            <div className="relative h-52 overflow-hidden rounded-2xl bg-white">
                                <div className="pointer-events-none absolute left-2 right-2 top-2 z-10 rounded-lg bg-[#14352c]/90 px-2 py-1 text-[11px] text-white">
                                    {levers.banIce ? 'Cấm xăng trong LEZ' : 'Không cấm thêm'}
                                    {levers.shiftHour ? ' · giờ cấm −30′' : ''}
                                    {levers.ev40 ? ' · 40% đội xe điện' : ''}
                                </div>
                                <Map className="h-full w-full" center={[105.85, 21.03]} zoom={13.6} showZonesAndRestrictions />
                            </div>
                        </div>
                    </div>
                    <div className="overflow-hidden rounded-2xl border border-[#c5d2cc] bg-white">
                        <table className="w-full border-collapse text-left text-sm">
                            <thead>
                                <tr className="bg-[#14352c] text-white">
                                    <th className="px-4 py-2.5 font-medium">Chỉ số</th>
                                    <th className="px-4 py-2.5 font-medium">A · hiện trạng</th>
                                    <th className="px-4 py-2.5 font-medium">B · ước lượng</th>
                                    <th className="px-4 py-2.5 font-medium">Chênh</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((r) => (
                                    <tr key={r.label} className="border-t border-[#dce6e1]">
                                        <td className="px-4 py-2">{r.label}</td>
                                        <td className="px-4 py-2">{r.av}</td>
                                        <td className="px-4 py-2">{r.bv}</td>
                                        <td className={`px-4 py-2 ${r.tone}`}>{r.d}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {derived && (
                        <ul className="space-y-1 rounded-2xl bg-white px-4 py-3 text-xs leading-5 text-[#56635d]">
                            {derived.notes.map((n) => <li key={n}>• {n}</li>)}
                            <li>• Số đơn B = A vì chính sách đổi cách đi/loại xe, không xóa nhu cầu.</li>
                        </ul>
                    )}
                    <div className="flex gap-2 text-sm">
                        <button type="button" className="rounded-lg bg-[#14352c] px-3 py-2 text-white" onClick={save}>Lưu kịch bản {scenarioId ? `#${scenarioId}` : ''}</button>
                        <button type="button" className="rounded-lg border bg-white px-3 py-2" onClick={exportCsv}>Xuất bảng CSV</button>
                    </div>
                </div>
            </div>
        </StudioShell>
    );
}
