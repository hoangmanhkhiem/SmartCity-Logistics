'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Clock } from 'lucide-react';
import { api } from '@/api';
import Map from '@/components/shared/map';
import type { GeoJsonFeatureCollection } from '@/components/shared/map';
import { DataCard } from '@/components/studio/page-ui';
import { PageHead, StudioShell, memberNav } from '@/components/studio/shell';
import { type IssueRow, issueTypeLabel, relativeTimeVi } from '@/app/co-quan/issue-labels';

export default function MemberMapPage() {
    const [congestion, setCongestion] = useState<GeoJsonFeatureCollection | null>(null);
    const [issues, setIssues] = useState<IssueRow[]>([]);
    const [fleetFilter, setFleetFilter] = useState<'all' | 'van' | 'bike'>('all');
    const [now, setNow] = useState('');

    useEffect(() => {
        api.get('/traffic/segments').then((r) => setCongestion(r.data)).catch(() => undefined);
        api.get('/bottlenecks').then((r) => setIssues(Array.isArray(r.data?.items) ? r.data.items : [])).catch(() => setIssues([]));
    }, []);

    useEffect(() => {
        const tick = () =>
            setNow(new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        tick();
        const id = window.setInterval(tick, 1000);
        return () => window.clearInterval(id);
    }, []);

    const jam = issues.filter((i) => i.issueType === 'congestion' || i.issueType === 'long_jam');

    return (
        <StudioShell group="ĐIỀU HÀNH" role="Thành viên" items={memberNav}>
            <PageHead
                title="Tình hình giao thông"
                crumb="Bản đồ giao thông"
                eyebrow={null}
                description="Theo dõi vận hành giao thông theo thời gian thực."
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                    { title: 'Điểm ùn tắc', value: jam.length, note: `${jam.length} điểm cần chú ý`, icon: <AlertTriangle size={18} />, tone: 'orange' },
                    { title: 'Cập nhật', value: now || '—', note: 'Thời gian máy', icon: <Clock size={18} />, tone: 'purple' },
                ].map((card) => (
                    <article className="cq-kpi" key={card.title}>
                        <span className={`metric-icon ${card.tone}`}>{card.icon}</span>
                        <div>
                            <p className="text-[12px] font-extrabold tracking-wide text-[#8490a5]">{card.title.toUpperCase()}</p>
                            <p className="mt-0.5 text-[26px] font-extrabold tracking-tight text-[#11213e]">{card.value}</p>
                            <p className="mt-1 text-[11px] text-[#087a69]">{card.note}</p>
                        </div>
                    </article>
                ))}
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
                <DataCard
                    title="Bản đồ vận hành"
                    subtitle={now ? `Cập nhật lúc ${now}` : 'Đang cập nhật'}
                    toolbar={
                        <div className="flex rounded-[10px] border border-[#e2e8f1] bg-[#f7f9fc] p-0.5 text-[12px] font-semibold">
                            {([['all', 'Tất cả'], ['van', 'Xe tải'], ['bike', 'Xe máy']] as const).map(([id, label]) => (
                                <button
                                    key={id}
                                    type="button"
                                    className={`h-8 rounded-[8px] px-3 ${fleetFilter === id ? 'bg-white text-[#152542] shadow-sm' : 'text-[#748298]'}`}
                                    onClick={() => setFleetFilter(id)}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    }
                >
                    <div className="dn-map px-4 pb-4">
                        <Map
                            className="h-full w-full rounded-[12px]"
                            center={[105.845, 21.027]}
                            zoom={13.2}
                            showZonesAndRestrictions
                            showApprovedIncidents
                            congestionGeoJson={congestion}
                        />
                    </div>
                </DataCard>

                <DataCard
                    title="Cảnh báo mới"
                    subtitle="Cập nhật theo khu vực"
                    toolbar={<Link href="/thanh-vien/bao-cao" className="text-sm font-semibold text-[#2f6bff]">Xem tất cả</Link>}
                >
                    <ul>
                        {issues.slice(0, 6).map((item) => (
                            <li key={item.id} className="flex gap-3 border-t border-[#edf0f5] px-5 py-3.5">
                                <span className="grid size-9 shrink-0 place-items-center rounded-[11px] bg-[#fff0e9] text-[#ff6a2b]">
                                    <AlertTriangle size={16} />
                                </span>
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-[#152542]">{item.note || issueTypeLabel(item.issueType)}</p>
                                    <p className="text-[11px] text-[#8490a5]">{issueTypeLabel(item.issueType)} · {relativeTimeVi(item.createdAt)}</p>
                                </div>
                            </li>
                        ))}
                        {!issues.length && <p className="px-5 py-6 text-sm text-[#8490a5]">Chưa có cảnh báo đã duyệt.</p>}
                    </ul>
                    <div className="m-4 rounded-[14px] bg-gradient-to-br from-[#152542] to-[#2f6bff] px-4 py-4 text-white">
                        <p className="text-[11px] font-semibold tracking-wide text-white/70">GỬI BÁO CÁO</p>
                        <p className="mt-1 text-sm">Gặp ùn tắc hoặc tai nạn trên đường?</p>
                        <Link href="/thanh-vien/bao-cao" className="mt-3 inline-flex h-9 items-center rounded-[10px] bg-white px-3 text-sm font-semibold text-[#152542]">Báo cáo giao thông</Link>
                    </div>
                </DataCard>
            </div>
        </StudioShell>
    );
}
