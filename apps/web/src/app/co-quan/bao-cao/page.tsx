'use client';

import { useEffect, useMemo, useState } from 'react';
import { api, zoneApi } from '@/api';
import { PageHead, StudioShell, regulatorNav } from '@/components/studio/shell';
import { DataCard } from '@/components/studio/page-ui';
import { DataTable, type Column } from '@/components/ui';
import Map from '@/components/shared/map';
import type { Zone } from '@/types';
import { CheckCircle2, Clock, Download, Eye, FileText, MapPin, AlertTriangle } from 'lucide-react';
import {
    type IssueRow,
    issueStatusLabel,
    issueTypeLabel,
    isPendingStatus,
    relativeTimeVi,
    reporterLabel,
} from '../issue-labels';

export default function RegulatorReportsPage() {
    const [issues, setIssues] = useState<IssueRow[]>([]);
    const [zones, setZones] = useState<Zone[]>([]);
    const [tab, setTab] = useState<'all' | 'pending' | 'approved'>('all');
    const [q, setQ] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const load = () => {
        api.get('/issues').then((r) => setIssues(r.data ?? [])).catch(() => setIssues([]));
        zoneApi.getAll({ limit: 100 }).then((r) => setZones(r.data.data ?? r.data)).catch(() => setZones([]));
    };
    useEffect(() => { load(); }, []);

    const zoneName = (id?: number | null) => zones.find((z) => z.id === id)?.name || 'Chưa gắn vùng';
    const today = new Date().toISOString().slice(0, 10);
    const todayIssues = issues.filter((i) => i.createdAt?.slice(0, 10) === today);
    const pending = issues.filter((i) => isPendingStatus(i.status));
    const approved = issues.filter((i) => i.status === 'approved');
    const urgent = pending.filter((i) => i.issueType === 'parking' || i.issueType === 'restriction');

    const types = Array.from(new Set(issues.map((i) => i.issueType).filter(Boolean))) as string[];

    const filtered = useMemo(() => {
        return issues.filter((i) => {
            if (tab === 'pending' && !isPendingStatus(i.status)) return false;
            if (tab === 'approved' && i.status !== 'approved') return false;
            if (typeFilter && i.issueType !== typeFilter) return false;
            if (statusFilter === 'pending' && !isPendingStatus(i.status)) return false;
            if (statusFilter && statusFilter !== 'pending' && i.status !== statusFilter) return false;
            const hay = `${i.note || ''} ${issueTypeLabel(i.issueType)} ${zoneName(i.zoneId)} ${i.reporterHash || ''}`.toLowerCase();
            return hay.includes(q.toLowerCase());
        });
    }, [issues, tab, typeFilter, statusFilter, q, zones]);

    const exportCsv = () => {
        const header = 'id,loai,trang_thai,ghi_chu,vung,createdAt';
        const lines = filtered.map((i) => [i.id, i.issueType, i.status, JSON.stringify(i.note || ''), zoneName(i.zoneId), i.createdAt].join(','));
        const blob = new Blob([[header, ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'bao-cao-giao-thong.csv';
        a.click();
    };

    const review = async (id: number, status: 'approved' | 'rejected') => {
        await api.patch(`/issues/${id}/review`, { status }).catch(() => api.patch(`/issues/${id}`, { status }));
        load();
    };

    return (
        <StudioShell group="CƠ QUAN QUẢN LÝ" role="Cơ quan quản lý" items={regulatorNav}>
            <PageHead
                title="Giám sát giao thông"
                description="Theo dõi và xác minh các báo cáo từ cộng đồng theo thời gian thực."
                extra={
                    <button type="button" className="inline-flex h-10 items-center gap-2 rounded-[9px] border border-[#d9e2ef] bg-white px-3.5 text-sm font-semibold text-[#33425c]" onClick={exportCsv}>
                        <Download size={16} /> Xuất báo cáo
                    </button>
                }
            />

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
                {[
                    { title: 'Tổng báo cáo hôm nay', value: todayIssues.length || issues.length, note: `${issues.length} trên hệ thống`, icon: <FileText size={18} />, tone: 'blue' },
                    { title: 'Đang chờ xác minh', value: pending.length, note: 'Cần xử lý sớm', icon: <Clock size={18} />, tone: 'orange' },
                    { title: 'Đã xác minh', value: approved.length, note: issues.length ? `${Math.round((approved.length / issues.length) * 100)}% tổng báo cáo` : '—', icon: <CheckCircle2 size={18} />, tone: 'green' },
                    { title: 'Cảnh báo khẩn cấp', value: urgent.length, note: `${urgent.filter((i) => i.issueType === 'parking' || i.issueType === 'restriction').length} cấm đường`, icon: <AlertTriangle size={18} />, tone: 'pink' },
                ].map((card) => (
                    <article className="cq-kpi" key={card.title}>
                        <span className={`metric-icon ${card.tone}`}>{card.icon}</span>
                        <div>
                            <p className="text-[13px] text-[#748298]">{card.title}</p>
                            <p className="mt-0.5 text-[23px] font-extrabold tracking-tight text-[#11213e]">{card.value}</p>
                            <p className="mt-1 text-[11px] text-[#8a97a9]">{card.note}</p>
                        </div>
                    </article>
                ))}
            </div>

            <div className="mt-4 h-72 overflow-hidden rounded-2xl bg-white">
                <Map className="h-full w-full" center={[105.8542, 21.0285]} zoom={12} showZonesAndRestrictions showApprovedIncidents />
            </div>

            <div className="mt-4">
                <DataCard
                    title="Danh sách báo cáo"
                    subtitle={`Cập nhật ${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}, hôm nay`}
                    toolbar={
                        <span className="cq-live">
                            <i /> Đang cập nhật trực tiếp
                        </span>
                    }
                >
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#edf0f5] px-5 py-3">
                        <div className="flex gap-5 text-sm">
                            {([
                                ['all', 'Tất cả', issues.length],
                                ['pending', 'Chờ xử lý', pending.length],
                                ['approved', 'Đã duyệt', approved.length],
                            ] as const).map(([id, label, n]) => (
                                <button
                                    key={id}
                                    type="button"
                                    className={`relative pb-3 font-semibold ${tab === id ? 'text-[#245fe4]' : 'text-[#75839a]'}`}
                                    onClick={() => setTab(id)}
                                >
                                    {label}
                                    {id === 'pending' && n > 0 && <span className="ml-1 rounded-full bg-[#fff0d7] px-1.5 text-[11px] text-[#d67b1c]">{n}</span>}
                                    {tab === id && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-[#2e6cf5]" />}
                                </button>
                            ))}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <input className="h-9 w-52 rounded-lg border border-[#dfe6ef] px-3 text-sm" placeholder="Tìm địa điểm, người báo..." value={q} onChange={(e) => setQ(e.target.value)} />
                            <select className="h-9 rounded-lg border border-[#dfe6ef] px-2 text-sm" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                                <option value="">Tất cả loại</option>
                                {types.map((t) => <option key={t} value={t}>{issueTypeLabel(t)}</option>)}
                            </select>
                            <select className="h-9 rounded-lg border border-[#dfe6ef] px-2 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                                <option value="">Tất cả trạng thái</option>
                                <option value="pending">Chờ xác minh</option>
                                <option value="approved">Đã duyệt</option>
                                <option value="rejected">Từ chối</option>
                            </select>
                        </div>
                    </div>
                    <DataTable
                        data={filtered}
                        emptyMessage="Chưa có báo cáo"
                        columns={[
                            { key: 'note', header: 'Báo cáo', render: (r) => (
                                <div>
                                    <p className="font-semibold text-[#11213e]">{r.note || issueTypeLabel(r.issueType)}</p>
                                    <p className="text-[11px] text-[#8995a7]">
                                        {isPendingStatus(r.status) ? 'Khẩn cấp' : issueTypeLabel(r.issueType)} · BC-{r.id}
                                    </p>
                                </div>
                            ) },
                            { key: 'zoneId', header: 'Địa điểm', render: (r) => (
                                <span className="inline-flex items-center gap-1 text-[#526077]"><MapPin size={13} /> {zoneName(r.zoneId)}</span>
                            ) },
                            { key: 'reporterHash', header: 'Người báo', render: (r) => reporterLabel(r.reporterHash, r.id) },
                            { key: 'createdAt', header: 'Thời gian', render: (r) => relativeTimeVi(r.createdAt) },
                            { key: 'status', header: 'Trạng thái', render: (r) => (
                                <span className={r.status === 'approved' ? 'cq-pill green' : r.status === 'rejected' ? 'cq-pill red' : 'cq-pill orange'}>
                                    {issueStatusLabel(r.status)}
                                </span>
                            ) },
                            { key: 'actions', header: '', className: 'text-right whitespace-nowrap', render: (r) => (
                                <div className="flex justify-end gap-2">
                                    {isPendingStatus(r.status) && (
                                        <>
                                            <button type="button" className="text-[#2f6bff]" onClick={() => review(r.id, 'approved')}>Duyệt</button>
                                            <button type="button" className="text-red-600" onClick={() => review(r.id, 'rejected')}>Loại</button>
                                        </>
                                    )}
                                    <Eye size={16} className="text-[#98a4b7]" />
                                </div>
                            ) },
                        ] satisfies Column<IssueRow>[]}
                    />
                </DataCard>
            </div>
        </StudioShell>
    );
}
