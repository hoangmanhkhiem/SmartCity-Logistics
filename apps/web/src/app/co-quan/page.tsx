'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { api, restrictionApi, zoneApi } from '@/api';
import Map from '@/components/shared/map';
import { PageHead, StudioShell, regulatorNav } from '@/components/studio/shell';
import type { GeoJsonFeatureCollection } from '@/components/shared/map';
import type { Zone } from '@/types';

type Issue = { id: number; issueType?: string; status?: string; zoneId?: number; note?: string };

export default function RegulatorMonitorPage() {
    const [congestion, setCongestion] = useState<GeoJsonFeatureCollection | null>(null);
    const [zones, setZones] = useState<Zone[]>([]);
    const [issues, setIssues] = useState<Issue[]>([]);
    const [rules, setRules] = useState<unknown[]>([]);
    const [ward, setWard] = useState('Tất cả');

    useEffect(() => {
        api.get('/traffic/segments').then((r) => setCongestion(r.data)).catch(() => undefined);
        zoneApi.getAll({ limit: 100 }).then((r) => setZones(r.data.data ?? r.data)).catch(() => undefined);
        api.get('/issues').then((r) => setIssues(r.data ?? [])).catch(() => setIssues([]));
        restrictionApi.getAll().then((r) => setRules(r.data ?? [])).catch(() => setRules([]));
    }, []);

    const approved = issues.filter((i) => i.status === 'approved');
    const typeCounts = approved.reduce<Record<string, number>>((acc, i) => {
        const k = i.issueType || 'Khác';
        acc[k] = (acc[k] ?? 0) + 1;
        return acc;
    }, {});
    const topType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0];
    const rows = useMemo(() => zones.map((z) => {
        const n = approved.filter((i) => i.zoneId === z.id).length;
        const ruleN = (rules as Array<{ zoneId?: number }>).filter((r) => r.zoneId === z.id).length;
        return { id: z.id, name: z.name, reports: n, rules: ruleN };
    }).sort((a, b) => b.reports - a.reports), [zones, approved, rules]);
    const shown = ward === 'Tất cả' ? rows : rows.filter((r) => r.name === ward);
    const typeTotal = Object.values(typeCounts).reduce((s, n) => s + n, 0) || 1;

    return (
        <StudioShell group="CƠ QUAN QUẢN LÝ" role="Cơ quan quản lý" items={regulatorNav}>
            <PageHead title="Giám sát logistics đô thị" extra={
                <select className="rounded-lg bg-white px-2 py-1 text-sm" value={ward} onChange={(e) => setWard(e.target.value)}>
                    <option>Tất cả</option>
                    {zones.map((z) => <option key={z.id}>{z.name}</option>)}
                </select>
            } />
            <div className="grid gap-4 px-6 pb-6 xl:grid-cols-[1fr_280px]">
                <div className="space-y-4">
                    <div className="grid gap-3 md:grid-cols-4">
                        {[
                            ['Phản ánh đã duyệt', String(approved.length)],
                            ['Khó khăn số 1', topType?.[0] || '—'],
                            ['Tổng phản ánh', String(issues.length)],
                            ['Quy định đang lưu', String(rules.length)],
                        ].map(([k, v]) => (
                            <article key={k} className="rounded-2xl bg-white p-4"><p className="text-xs text-[#7b8781]">{k}</p><p className="mt-1 text-xl font-semibold">{v}</p></article>
                        ))}
                    </div>
                    <div className="h-80 overflow-hidden rounded-2xl bg-white"><Map className="h-full w-full" center={[105.84, 21.028]} zoom={13} congestionGeoJson={congestion} showZonesAndRestrictions /></div>
                    <table className="w-full rounded-2xl bg-white text-sm">
                        <thead className="text-left text-xs text-[#7b8781]"><tr><th className="px-4 py-3">Vùng</th><th>Phản ánh duyệt</th><th>Quy định</th><th></th></tr></thead>
                        <tbody>
                            {shown.map((r) => (
                                <tr key={r.id} className="border-t">
                                    <td className="px-4 py-3">{r.name}</td>
                                    <td>{r.reports}</td>
                                    <td>{r.rules}</td>
                                    <td><Link className="text-[#0e6e5c]" href="/co-quan/zone">Quản lý</Link></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <aside className="space-y-3">
                    <section className="rounded-2xl bg-white p-4 text-sm">
                        <h2 className="font-semibold">Ở nghẽn nhất</h2>
                        <ol className="mt-2 space-y-2">
                            {rows.slice(0, 3).map((r, i) => <li key={r.id}>{i + 1}. {r.name} · {r.reports} phản ánh</li>)}
                            {rows.length === 0 && <li>Chưa có dữ liệu</li>}
                        </ol>
                    </section>
                    <section className="rounded-2xl bg-white p-4 text-sm">
                        <h2 className="font-semibold">Theo loại khó khăn</h2>
                        {Object.entries(typeCounts).map(([n, c]) => {
                            const p = `${Math.round((c / typeTotal) * 100)}%`;
                            return (
                                <div key={n} className="mt-2"><div className="flex justify-between text-xs"><span>{n}</span><span>{p}</span></div><div className="mt-1 h-1.5 rounded-full bg-[#e7eee9]"><div className="h-1.5 rounded-full bg-[#0e6e5c]" style={{ width: p }} /></div></div>
                            );
                        })}
                    </section>
                </aside>
            </div>
        </StudioShell>
    );
}
