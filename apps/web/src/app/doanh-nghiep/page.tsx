'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, analyticsApi } from '@/api';
import Map from '@/components/shared/map';
import { PageHead, StudioShell, orgNav } from '@/components/studio/shell';
import { useAuthStore } from '@/stores/auth-store';
import type { GeoJsonFeatureCollection } from '@/components/shared/map';

type Summary = {
    orders?: { total?: number; byStatus?: Record<string, number> };
    environment?: { estimatedCo2GramsTotal?: number; avgRouteDistanceKm?: number };
    operations?: { unassignedOrders?: number };
};
type Plan = { id: number; status?: string; createdAt?: string; result?: { orders?: number } };
type Profile = { legalName?: string; name?: string; fleetSize?: number; anonymizePublic?: boolean; isPartner?: boolean; address?: string };

export default function OrgOverviewPage() {
    const { user } = useAuthStore();
    const orgName = user?.memberships?.[0]?.organization?.name || 'Doanh nghiệp';
    const [congestion, setCongestion] = useState<GeoJsonFeatureCollection | null>(null);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [pdfMsg, setPdfMsg] = useState('');

    useEffect(() => {
        api.get('/traffic/segments').then((r) => setCongestion(r.data)).catch(() => undefined);
        analyticsApi.getPlatformSummary().then((r) => setSummary(r.data)).catch(() => undefined);
        api.get('/plans').then((r) => setPlans(r.data ?? [])).catch(() => setPlans([]));
        api.get('/phases/partner/profile').then((r) => setProfile(r.data)).catch(() => undefined);
    }, []);

    const delivered = summary?.orders?.byStatus?.delivered ?? 0;
    const total = summary?.orders?.total ?? 0;
    const onTime = total ? Math.round((delivered / Math.max(total, 1)) * 100) : 0;
    const co2 = summary?.environment?.estimatedCo2GramsTotal ?? 0;
    const perOrder = total ? Math.round(co2 / total) : 0;

    const downloadReport = () => {
        const lines = [
            'Chi so,DN,Ghi chu',
            `Don hang,${total},tong`,
            `Da giao,${delivered},`,
            `CO2e g,${co2},uoc tinh`,
            `CO2e / don,${perOrder},`,
        ];
        const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'bao-cao-dn.csv';
        a.click();
        setPdfMsg('Đã xuất CSV (mở bằng Excel / lưu PDF từ máy in).');
    };

    return (
        <StudioShell group="DOANH NGHIỆP" role="Quản trị DN" items={orgNav}>
            <PageHead title="Tổng quan" extra={<span className="text-sm text-[#56635d]">{orgName}</span>} />
            <div className="grid gap-4 px-6 pb-6 xl:grid-cols-[1fr_300px]">
                <div className="space-y-4">
                    <div className="grid gap-3 md:grid-cols-4">
                        {[
                            ['Đơn hàng', String(total), `${summary?.operations?.unassignedOrders ?? 0} chưa lập tuyến`],
                            ['Km TB / chuyến', `${(summary?.environment?.avgRouteDistanceKm ?? 0).toFixed(1)}`, 'từ tuyến đã lưu'],
                            ['CO₂e mỗi đơn', `${perOrder} g`, `${co2} g tổng`],
                            ['Tỷ lệ đã giao', `${onTime}%`, 'trên tổng đơn'],
                        ].map(([label, value, note]) => (
                            <article key={label} className="rounded-2xl bg-white p-4"><p className="text-xs text-[#7b8781]">{label}</p><p className="mt-1 text-2xl font-semibold">{value}</p><p className="text-xs text-[#0e6e5c]">{note}</p></article>
                        ))}
                    </div>
                    <section className="rounded-2xl bg-white p-4 text-sm">
                        <div className="flex items-center justify-between">
                            <h2 className="font-semibold">Báo cáo vận hành</h2>
                            <button type="button" className="rounded-lg border px-3 py-1 text-xs" onClick={downloadReport}>Xuất CSV</button>
                        </div>
                        {pdfMsg && <p className="mt-2 text-xs">{pdfMsg}</p>}
                        <table className="mt-3 w-full">
                            <thead className="text-left text-xs text-[#7b8781]"><tr><th className="py-2">Chỉ số</th><th>Giá trị</th></tr></thead>
                            <tbody>
                                <tr className="border-t"><td className="py-2">Đơn pending</td><td>{summary?.orders?.byStatus?.pending ?? 0}</td></tr>
                                <tr className="border-t"><td className="py-2">Đơn đang giao</td><td>{summary?.orders?.byStatus?.in_transit ?? 0}</td></tr>
                                <tr className="border-t"><td className="py-2">Quy mô đội xe (hồ sơ)</td><td>{profile?.fleetSize ?? '—'}</td></tr>
                            </tbody>
                        </table>
                    </section>
                    <section className="rounded-2xl bg-white p-4">
                        <div className="mb-2 flex justify-between text-sm"><h2 className="font-semibold">Kho và điểm của doanh nghiệp</h2><Link href="/doanh-nghiep/doi-xe" className="text-[#0e6e5c]">Quản lý</Link></div>
                        <div className="h-64 overflow-hidden rounded-xl"><Map className="h-full w-full" center={[105.84, 21.03]} zoom={13} congestionGeoJson={congestion} /></div>
                    </section>
                </div>
                <aside className="space-y-3">
                    <section className="rounded-2xl bg-white p-4 text-sm">
                        <div className="flex justify-between"><h2 className="font-semibold">Hồ sơ đối tác</h2></div>
                        <p className="mt-2 text-[#3f4a45]">{profile?.legalName || orgName}</p>
                        <p className="text-xs text-[#7b8781]">{profile?.address || 'Chưa có địa chỉ'}</p>
                        <Link href="/studio/doi-tac" className="mt-4 block rounded-lg bg-[#0e6e5c] py-2 text-center text-white">Cập nhật hồ sơ</Link>
                    </section>
                    <section className="rounded-2xl bg-white p-4 text-sm">
                        <div className="flex justify-between"><h2 className="font-semibold">Kế hoạch tuyến gần đây</h2><Link href="/doanh-nghiep/toi-uu" className="text-xs text-[#0e6e5c]">Tất cả</Link></div>
                        <ul className="mt-2 space-y-2">
                            {plans.slice(0, 5).map((p) => (
                                <li key={p.id} className="flex justify-between"><span>Kế hoạch #{p.id}</span><span className="text-[#0e6e5c]">{p.status}</span></li>
                            ))}
                            {plans.length === 0 && <li className="text-[#7b8781]">Chưa có kế hoạch. Chạy tối ưu tuyến để lưu.</li>}
                        </ul>
                    </section>
                </aside>
            </div>
        </StudioShell>
    );
}
