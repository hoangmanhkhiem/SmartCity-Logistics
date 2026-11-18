'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, analyticsApi, facilityApi } from '@/api';
import Map from '@/components/shared/map';
import { DataCard } from '@/components/studio/page-ui';
import { PageHead, StudioShell, orgNav } from '@/components/studio/shell';
import { useAuthStore } from '@/stores/auth-store';
import { DataTable, type Column } from '@/components/ui';
import type { Facility } from '@/types';

type Summary = {
    orders?: { total?: number; byStatus?: Record<string, number> };
    environment?: { estimatedCo2GramsTotal?: number; avgRouteDistanceKm?: number };
    operations?: { unassignedOrders?: number };
};
type Plan = { id: number; status?: string; createdAt?: string; result?: { orders?: number } };
type Profile = { legalName?: string; name?: string; fleetSize?: number; anonymizePublic?: boolean; isPartner?: boolean; address?: string };

function planStatus(status?: string) {
    if (status === 'done' || status === 'completed') return { label: 'Hoàn tất', cls: 'cq-pill green' };
    if (status === 'cancelled') return { label: 'Huỷ', cls: 'cq-pill red' };
    return { label: 'Bản nháp', cls: 'cq-pill orange' };
}

export default function OrgOverviewPage() {
    const { user } = useAuthStore();
    const orgName = user?.memberships?.[0]?.organization?.name || 'Doanh nghiệp';
    const [summary, setSummary] = useState<Summary | null>(null);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [facilities, setFacilities] = useState<Facility[]>([]);
    const [pdfMsg, setPdfMsg] = useState('');

    useEffect(() => {
        analyticsApi.getPlatformSummary().then((r) => setSummary(r.data)).catch(() => undefined);
        api.get('/plans').then((r) => setPlans(r.data ?? [])).catch(() => setPlans([]));
        api.get('/phases/partner/profile').then((r) => setProfile(r.data)).catch(() => undefined);
        facilityApi.getAll({ limit: 80 }).then((r) => setFacilities(r.data.data ?? r.data)).catch(() => setFacilities([]));
    }, []);

    const delivered = summary?.orders?.byStatus?.delivered ?? 0;
    const pending = summary?.orders?.byStatus?.pending ?? 0;
    const transit = summary?.orders?.byStatus?.in_transit ?? 0;
    const total = summary?.orders?.total ?? 0;
    const onTime = total ? Math.round((delivered / Math.max(total, 1)) * 100) : 0;
    const co2 = summary?.environment?.estimatedCo2GramsTotal ?? 0;
    const unassigned = summary?.operations?.unassignedOrders ?? 0;
    const km = summary?.environment?.avgRouteDistanceKm ?? 0;
    const initials = orgName.slice(0, 2).toUpperCase();

    const downloadReport = () => {
        const lines = [
            'Chi so,Gia tri,Ghi chu',
            `Don hang,${total},tong`,
            `Cho lap tuyen,${unassigned},`,
            `Dang giao,${transit},`,
            `Da giao,${delivered},`,
            `CO2e g,${co2},uoc tinh`,
        ];
        const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'bao-cao-dn.csv';
        a.click();
        setPdfMsg('Đã xuất CSV.');
    };

    const markers = facilities
        .filter((f) => Number.isFinite(f.longitude) && Number.isFinite(f.latitude))
        .map((f) => ({
            id: `f-${f.id}`,
            coordinates: [f.longitude, f.latitude] as [number, number],
            type: (f.kind as 'warehouse' | 'hub' | 'charging_station') || 'warehouse',
            label: f.name,
            popup: f.address || f.name,
        }));

    return (
        <StudioShell group="DOANH NGHIỆP" role="Quản trị DN" items={orgNav}>
            <PageHead
                title="Tổng quan"
                eyebrow="TRUNG TÂM ĐIỀU HÀNH"
                extra={<span className="cq-live"><i /> Dữ liệu trực tiếp</span>}
            />

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
                <div className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        {[
                            { label: 'Đơn hàng', value: total.toLocaleString('vi-VN'), note: `${unassigned.toLocaleString('vi-VN')} chưa lập tuyến`, tag: unassigned ? `${unassigned}` : undefined, tagClass: 'cq-tag-green', href: '/doanh-nghiep/dieu-phoi' },
                            { label: 'Quãng đường / chuyến', value: `${km.toFixed(1)} km`, note: 'Từ tuyến đã lưu' },
                            { label: 'CO₂e mỗi đơn', value: total ? `${Math.round(co2 / total)} g` : '0 g', note: `${co2} g tổng`, tag: 'Tối ưu', tagClass: 'cq-tag-green' },
                            { label: 'Tỷ lệ đã giao', value: `${onTime}%`, note: 'Trên tổng đơn', tag: delivered ? `+${delivered}` : undefined, tagClass: 'cq-tag-green' },
                        ].map((card) => {
                            const inner = (
                                <>
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="text-[12px] text-[#748298]">{card.label}</p>
                                        {card.tag && <span className={card.tagClass}>{card.tag}</span>}
                                    </div>
                                    <p className="mt-2 text-[28px] font-extrabold tracking-tight text-[#11213e]">{card.value}</p>
                                    <p className="mt-1 text-[12px] text-[#087a69]">{card.note}</p>
                                </>
                            );
                            const cls = 'rounded-[16px] border border-[#e6ebf2] bg-white p-4 shadow-[0_4px_9px_rgba(21,42,78,0.04)]';
                            return card.href ? (
                                <Link key={card.label} href={card.href} className={`${cls} block hover:border-[#c5d0de]`}>{inner}</Link>
                            ) : (
                                <article key={card.label} className={cls}>{inner}</article>
                            );
                        })}
                    </div>

                    <DataCard
                        title="Báo cáo vận hành"
                        subtitle="Chỉ số điều hành trong ngày"
                        toolbar={<button type="button" className="h-9 rounded-[11px] border border-[#dce3ed] bg-white px-3 text-sm font-semibold text-[#33425c]" onClick={downloadReport}>Xuất CSV</button>}
                    >
                        {pdfMsg && <p className="px-5 pt-2 text-xs text-[#087a69]">{pdfMsg}</p>}
                        <DataTable
                            pagination={false}
                            data={[
                                { id: 'pending', metric: 'Đơn đang chờ xử lý', value: pending.toLocaleString('vi-VN'), pill: unassigned ? 'Cần lập tuyến' : 'Ổn định', tone: unassigned ? 'orange' : 'green' },
                                { id: 'transit', metric: 'Đơn đang giao', value: transit.toLocaleString('vi-VN'), pill: transit ? 'Đang chạy' : '—', tone: transit ? 'green' : '' },
                                { id: 'fleet', metric: 'Quy mô đội xe', value: String(profile?.fleetSize ?? '—'), pill: 'Sẵn sàng', tone: 'green' },
                            ]}
                            columns={[
                                { key: 'metric', header: 'Chỉ số' },
                                { key: 'value', header: 'Giá trị', render: (r) => <span className="font-semibold text-[#152542]">{r.value}</span> },
                                { key: 'pill', header: 'Thay đổi', render: (r) => r.tone ? <span className={`cq-pill ${r.tone}`}>{r.pill}</span> : <span className="text-[#8a97a9]">{r.pill}</span> },
                            ] satisfies Column<{ id: string; metric: string; value: string; pill: string; tone: string }>[]}
                        />
                    </DataCard>

                </div>

                <aside className="space-y-3">
                    <section className="rounded-[16px] border border-[#e6ebf2] bg-white p-5 shadow-[0_8px_30px_rgba(11,27,58,0.045)]">
                        <div className="flex items-start justify-between">
                            <span className="grid size-10 place-items-center rounded-[11px] bg-[#edf3ff] text-sm font-extrabold text-[#2f6bff]">{initials}</span>
                            <span className="cq-pill green">Đã xác minh</span>
                        </div>
                        <p className="mt-4 text-[11px] font-extrabold tracking-wide text-[#8490a5]">HỒ SƠ ĐỐI TÁC</p>
                        <p className="mt-1 text-[16px] font-bold text-[#152542]">{profile?.legalName || orgName}</p>
                        <p className="mt-1 text-[13px] text-[#748298]">{profile?.address || 'Chưa có địa chỉ'}</p>
                        <Link href="/studio/doi-tac" className="nc-cta mt-4">Cập nhật hồ sơ</Link>
                    </section>
                    <section className="rounded-[16px] border border-[#e6ebf2] bg-white p-5 shadow-[0_8px_30px_rgba(11,27,58,0.045)]">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[11px] font-extrabold tracking-wide text-[#8490a5]">KẾ HOẠCH</p>
                                <h2 className="text-[16px] font-bold text-[#152542]">Tuyến gần đây</h2>
                            </div>
                            <Link href="/doanh-nghiep/toi-uu" className="text-sm font-semibold text-[#087a69]">Tất cả</Link>
                        </div>
                        <ul className="mt-3 space-y-2">
                            {plans.slice(0, 4).map((p, i) => {
                                const st = planStatus(p.status);
                                return (
                                    <li key={p.id} className="flex items-center gap-3 rounded-[12px] bg-[#f7f9fc] px-3 py-2.5">
                                        <span className="grid size-8 place-items-center rounded-[9px] bg-[#e8f7f2] text-[11px] font-extrabold text-[#087a69]">{String(i + 1).padStart(2, '0')}</span>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold text-[#152542]">Kế hoạch #{p.id}</p>
                                            <p className="text-[11px] text-[#8490a5]">{p.result?.orders ?? '—'} đơn</p>
                                        </div>
                                        <span className={st.cls}>{st.label}</span>
                                    </li>
                                );
                            })}
                            {!plans.length && <p className="text-sm text-[#8490a5]">Chưa có kế hoạch. Chạy tối ưu tuyến để lưu.</p>}
                        </ul>
                    </section>
                </aside>
            </div>

            <DataCard
                className="mt-4"
                title="Kho và điểm của doanh nghiệp"
                subtitle="PHÂN BỔ"
                toolbar={<Link href="/doanh-nghiep/doi-xe" className="text-sm font-semibold text-[#087a69]">Quản lý điểm →</Link>}
            >
                <div className="dn-map px-4 pb-4">
                    <Map className="h-full w-full rounded-[12px]" center={[105.84, 21.03]} zoom={13} showZonesAndRestrictions markers={markers} />
                </div>
            </DataCard>
        </StudioShell>
    );
}
