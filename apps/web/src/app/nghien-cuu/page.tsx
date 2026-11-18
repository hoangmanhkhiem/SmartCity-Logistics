'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ClipboardList, Clock, XCircle } from 'lucide-react';
import { api, userApi, zoneApi } from '@/api';
import Map from '@/components/shared/map';
import { DataCard } from '@/components/studio/page-ui';
import { PageHead, StudioShell, researchNav } from '@/components/studio/shell';
import { DataTable, type Column } from '@/components/ui';
import type { Zone } from '@/types';

type Row = {
    id: number;
    siteCode?: string | null;
    status?: string;
    submittedBy?: number;
    zoneId?: number | null;
    form?: { code?: string };
};
type UserRow = { id: number; name: string; email: string };

const FORMS = [
    { code: 'shipper', label: 'shipper' },
    { code: 'last_mile_company', label: 'doanh nghiệp' },
];

function surveyStatus(status?: string) {
    if (status === 'approved') return { label: 'Đã duyệt', cls: 'cq-pill green' };
    if (status === 'rejected') return { label: 'Bị loại', cls: 'cq-pill red' };
    return { label: 'Chờ duyệt', cls: 'cq-pill orange' };
}

export default function ResearchSurveyPage() {
    const [rows, setRows] = useState<Row[]>([]);
    const [zones, setZones] = useState<Zone[]>([]);
    const [users, setUsers] = useState<UserRow[]>([]);
    const [message, setMessage] = useState('');
    const [q, setQ] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [assign, setAssign] = useState({ userId: '', formCode: 'shipper', quota: '15', dueDate: '' });

    const load = () => {
        api.get('/surveys/responses').then((r) => setRows(r.data ?? [])).catch(() => setRows([]));
        zoneApi.getAll({ limit: 100 }).then((r) => setZones(r.data.data ?? r.data)).catch(() => setZones([]));
        userApi.getAll({ limit: 100 }).then((r) => setUsers(r.data.data ?? r.data)).catch(() => undefined);
    };
    useEffect(() => { load(); }, []);

    const zoneName = (id?: number | null) => zones.find((z) => z.id === id)?.name || '—';
    const pending = rows.filter((r) => r.status !== 'approved' && r.status !== 'rejected');
    const approved = rows.filter((r) => r.status === 'approved');
    const rejected = rows.filter((r) => r.status === 'rejected');

    const filtered = useMemo(() => {
        return rows.filter((r) => {
            if (statusFilter === 'pending' && (r.status === 'approved' || r.status === 'rejected')) return false;
            if (statusFilter && statusFilter !== 'pending' && r.status !== statusFilter) return false;
            const hay = `${r.siteCode || ''} ${zoneName(r.zoneId)} ${r.id}`.toLowerCase();
            return hay.includes(q.toLowerCase());
        });
    }, [rows, q, statusFilter, zones]);

    const submitAssign = (e: FormEvent) => {
        e.preventDefault();
        api.post('/surveys/assignments', {
            userId: Number(assign.userId),
            formCode: assign.formCode,
            quota: Number(assign.quota),
            dueDate: assign.dueDate || undefined,
        }).then(() => { setMessage('Đã giao nhiệm vụ.'); load(); }).catch(() => setMessage('Cần đăng nhập nghiên cứu viên và chọn người nhận.'));
    };

    const importCsv = async (file: File) => {
        try {
            const r = await api.post('/phases/surveys/import', { csv: await file.text(), commit: true });
            setMessage(`Đã nhập phiếu (${JSON.stringify(r.data).slice(0, 80)})`);
            load();
        } catch {
            setMessage('Không nhập được CSV.');
        }
    };

    const review = (id: number, status: 'approved' | 'rejected') => {
        api.patch(`/surveys/responses/${id}/review`, { status }).then(load).catch(() => undefined);
    };

    return (
        <StudioShell group="NGHIÊN CỨU" role="Nghiên cứu viên" items={researchNav}>
            <PageHead
                title="Khảo sát & duyệt phiếu"
                eyebrow="NGHIÊN CỨU & VẬN HÀNH"
                description="Theo dõi tiến độ thu thập, phân công khảo sát và duyệt dữ liệu hiện trường."
                extra={
                    <>
                        <input type="file" accept=".csv" className="hidden" id="gf-csv" onChange={(e) => { const f = e.target.files?.[0]; if (f) importCsv(f); e.target.value = ''; }} />
                        <label htmlFor="gf-csv" className="cursor-pointer rounded-[11px] border border-[#dce3ed] bg-white px-3.5 py-2 text-sm font-semibold text-[#33425c]">Nhập CSV Google Form</label>
                    </>
                }
            />

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
                {[
                    { title: 'Tổng phiếu', value: rows.length, note: 'Trên hệ thống', icon: <ClipboardList size={18} />, tone: 'blue' },
                    { title: 'Chờ duyệt', value: pending.length, note: 'Cần xử lý', icon: <Clock size={18} />, tone: 'orange' },
                    { title: 'Đã duyệt', value: approved.length, note: rows.length ? `${Math.round((approved.length / rows.length) * 1000) / 10}% tổng số` : '—', icon: <CheckCircle2 size={18} />, tone: 'green' },
                    { title: 'Bị loại', value: rejected.length, note: rows.length ? `${Math.round((rejected.length / rows.length) * 1000) / 10}% tổng số` : '—', icon: <XCircle size={18} />, tone: 'pink' },
                ].map((card) => (
                    <article className="cq-kpi" key={card.title}>
                        <span className={`metric-icon ${card.tone}`}>{card.icon}</span>
                        <div>
                            <p className="text-[13px] text-[#748298]">{card.title}</p>
                            <p className="mt-0.5 text-[28px] font-extrabold tracking-tight text-[#11213e]">{card.value}</p>
                            <p className="mt-1 text-[11px] text-[#8a97a9]">{card.note}</p>
                        </div>
                    </article>
                ))}
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
                <div className="h-[320px] overflow-hidden rounded-[16px] bg-white shadow-[0_8px_30px_rgba(11,27,58,0.045)]">
                    <Map className="h-full w-full" center={[105.84, 21.03]} zoom={13} showZonesAndRestrictions />
                </div>
                <form className="rounded-[16px] border border-[#e6ebf2] bg-white p-5 text-sm shadow-[0_8px_30px_rgba(11,27,58,0.045)]" onSubmit={submitAssign}>
                    <h2 className="text-[16px] font-bold text-[#152542]">Giao nhiệm vụ khảo sát</h2>
                    <p className="mt-0.5 text-[13px] text-[#748298]">Tạo đợt thu thập dữ liệu mới</p>
                    <label className="mt-4 block text-[12px] font-semibold text-[#33425c]">Người nhận
                        <select className="mt-1.5 h-10 w-full rounded-[11px] border border-[#dce3ed] px-3" value={assign.userId} onChange={(e) => setAssign({ ...assign, userId: e.target.value })} required>
                            <option value="">Chọn tài khoản</option>
                            {users.map((u) => <option key={u.id} value={u.id}>{u.name} · {u.email}</option>)}
                        </select>
                    </label>
                    <p className="mt-3 text-[12px] font-semibold text-[#33425c]">Mẫu phiếu</p>
                    <div className="mt-1.5 flex gap-2">
                        {FORMS.map((f) => (
                            <button
                                key={f.code}
                                type="button"
                                className={`h-9 flex-1 rounded-[11px] border text-sm ${assign.formCode === f.code ? 'border-[#9ad4c4] bg-[#e8f7f2] font-semibold text-[#087a69]' : 'border-[#dce3ed] bg-white text-[#33425c]'}`}
                                onClick={() => setAssign({ ...assign, formCode: f.code })}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                        <label className="text-[12px] font-semibold text-[#33425c]">Số phiếu
                            <input className="mt-1.5 h-10 w-full rounded-[11px] border border-[#dce3ed] px-3" value={assign.quota} onChange={(e) => setAssign({ ...assign, quota: e.target.value })} />
                        </label>
                        <label className="text-[12px] font-semibold text-[#33425c]">Hạn
                            <input className="mt-1.5 h-10 w-full rounded-[11px] border border-[#dce3ed] px-3" type="date" value={assign.dueDate} onChange={(e) => setAssign({ ...assign, dueDate: e.target.value })} />
                        </label>
                    </div>
                    <button className="nc-cta mt-4" type="submit">Giao nhiệm vụ</button>
                    {message && <p className="mt-2 text-xs text-[#152542]">{message}</p>}
                </form>
            </div>

            <div className="mt-4">
                <DataCard
                    title="Phiếu khảo sát"
                    subtitle={`${filtered.length} phiếu cập nhật gần nhất`}
                    toolbar={
                        <div className="flex flex-wrap gap-2">
                            <input className="h-9 w-44 rounded-[11px] border border-[#dce3ed] px-3 text-sm" placeholder="Tìm mã phiếu..." value={q} onChange={(e) => setQ(e.target.value)} />
                            <select className="h-9 rounded-[11px] border border-[#dce3ed] px-2 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                                <option value="">Lọc trạng thái</option>
                                <option value="pending">Chờ duyệt</option>
                                <option value="approved">Đã duyệt</option>
                                <option value="rejected">Bị loại</option>
                            </select>
                        </div>
                    }
                >
                    <DataTable
                        data={filtered}
                        emptyMessage="Chưa có phiếu"
                        columns={[
                            { key: 'siteCode', header: 'Mã', render: (r) => <span className="font-semibold text-[#152542]">{r.siteCode || `HN-${r.id}`}</span> },
                            { key: 'zoneId', header: 'Khu vực', render: (r) => zoneName(r.zoneId) },
                            { key: 'status', header: 'Trạng thái', render: (r) => {
                                const s = surveyStatus(r.status);
                                return <span className={s.cls}>{s.label}</span>;
                            } },
                            { key: 'actions', header: 'Thao tác', className: 'text-right whitespace-nowrap', render: (r) => (
                                <div className="space-x-3 text-[13px]">
                                    <button type="button" className="text-[#2f6bff]" onClick={() => review(r.id, 'approved')}>Duyệt</button>
                                    <button type="button" className="text-[#2f6bff]" onClick={() => review(r.id, 'rejected')}>Loại</button>
                                    <button type="button" className="text-[#2f6bff]" onClick={() => api.delete(`/surveys/responses/${r.id}`).then(load)}>Xoá</button>
                                </div>
                            ) },
                        ] satisfies Column<Row>[]}
                    />
                </DataCard>
            </div>
        </StudioShell>
    );
}
