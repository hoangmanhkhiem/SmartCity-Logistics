'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/api';
import Map from '@/components/shared/map';
import { PageHead, StudioShell, regulatorNav } from '@/components/studio/shell';
import type { GeoJsonFeatureCollection } from '@/components/shared/map';

const rows = [
    ['Hoàn Kiếm', '148', '4,3', '12', '[g]', '2 quy định'],
    ['Cửa Nam', '66', '4,0', '9', '[g]', '2 quy định'],
    ['Cầu Giấy', '88', '3,7', '17', '[g]', '1 quy định'],
];

export default function RegulatorMonitorPage() {
    const [congestion, setCongestion] = useState<GeoJsonFeatureCollection | null>(null);
    const [ward, setWard] = useState('Tất cả');
    useEffect(() => { api.get('/traffic/segments').then((r) => setCongestion(r.data)).catch(() => undefined); }, []);
    return (
        <StudioShell group="CƠ QUAN QUẢN LÝ" role="Cơ quan quản lý" items={regulatorNav}>
            <PageHead title="Giám sát logistics đô thị" extra={<><select className="rounded-lg bg-white px-2 py-1 text-sm" value={ward} onChange={(e) => setWard(e.target.value)}><option>Tất cả</option><option>Hoàn Kiếm</option><option>Cửa Nam</option><option>Cầu Giấy</option></select><span className="rounded-lg bg-white px-2 py-1 text-sm">Khung giờ ▾</span></>} />
            <div className="grid gap-4 px-6 pb-6 xl:grid-cols-[1fr_280px]">
                <div className="space-y-4">
                    <div className="grid gap-3 md:grid-cols-4">
                        {[['Phản ánh đã duyệt 30 ngày', '412'], ['Khó khăn số 1', 'Không chỗ dừng đỗ'], ['Điểm đỗ đã xác minh', '57'], ['Xe điện (DN khai)', '19%']].map(([k, v]) => (
                            <article key={k} className="rounded-2xl bg-white p-4"><p className="text-xs text-[#7b8781]">{k}</p><p className="mt-1 text-xl font-semibold">{v}</p></article>
                        ))}
                    </div>
                    <div className="h-80 overflow-hidden rounded-2xl bg-white"><Map className="h-full w-full" center={[105.84, 21.028]} zoom={13} congestionGeoJson={congestion} showZonesAndRestrictions /></div>
                    <table className="w-full rounded-2xl bg-white text-sm">
                        <thead className="text-left text-xs text-[#7b8781]"><tr><th className="px-4 py-3">Phường</th><th>Phản ánh</th><th>Mức khó đỗ</th><th>Điểm đỗ</th><th>CO₂e / đơn</th><th></th></tr></thead>
                        <tbody>
                            {rows.filter((r) => ward === 'Tất cả' || r[0] === ward).map((r) => (
                                <tr key={r[0]} className="border-t">{r.slice(0, 5).map((c) => <td key={c} className="px-4 py-3">{c}</td>)}<td><Link className="text-[#0e6e5c]" href="/co-quan/zone">{r[5]}</Link></td></tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <aside className="space-y-3">
                    <section className="rounded-2xl bg-white p-4 text-sm">
                        <h2 className="font-semibold">Ở nghẽn nhất</h2>
                        <ol className="mt-2 space-y-2"><li>1. Hoàn Kiếm · trưa · 48 phản ánh</li><li>2. Cửa Nam</li><li>3. Cầu Giấy · cấm giờ, vỉa hè</li></ol>
                    </section>
                    <section className="rounded-2xl bg-white p-4 text-sm">
                        <h2 className="font-semibold">Theo loại khó khăn</h2>
                        {[['Không chỗ đỗ', '35%'], ['Ùn tắc', '24%'], ['Cấm đường/giờ', '18%'], ['Khác', '23%']].map(([n, p]) => (
                            <div key={n} className="mt-2"><div className="flex justify-between text-xs"><span>{n}</span><span>{p}</span></div><div className="mt-1 h-1.5 rounded-full bg-[#e7eee9]"><div className="h-1.5 rounded-full bg-[#0e6e5c]" style={{ width: p }} /></div></div>
                        ))}
                    </section>
                </aside>
            </div>
        </StudioShell>
    );
}
