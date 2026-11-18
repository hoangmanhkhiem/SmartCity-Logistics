'use client';

import { useEffect, useState } from 'react';
import { api } from '@/api';
import { Button, DataTable, Input, type Column } from '@/components/ui';
import { PageHead } from '@/components/studio/shell';
import { DataCard, SoftTag } from '@/components/studio/page-ui';
import { MoreHorizontal, Plus } from 'lucide-react';

type Row = Record<string, unknown> & { id: number };

const tabs = [
    { id: 'surveys', label: 'Phiếu khảo sát', list: '/surveys/responses', update: (id: number, body: object) => api.patch(`/surveys/responses/${id}`, body), remove: (id: number) => api.delete(`/surveys/responses/${id}`) },
    { id: 'issues', label: 'Phản ánh', list: '/issues', update: (id: number, body: object) => api.patch(`/issues/${id}`, body), remove: (id: number) => api.delete(`/issues/${id}`) },
    { id: 'plans', label: 'Kế hoạch tuyến', list: '/plans', update: (id: number, body: object) => api.patch(`/plans/${id}`, body), remove: (id: number) => api.delete(`/plans/${id}`) },
    { id: 'scenarios', label: 'Kịch bản', list: '/scenarios', update: (id: number, body: object) => api.patch(`/scenarios/${id}`, body), remove: (id: number) => api.delete(`/scenarios/${id}`) },
];

function statusTone(status: string) {
    if (status.includes('duyệt') || status === 'approved') return 'green' as const;
    if (status.includes('từ chối') || status === 'rejected') return 'red' as const;
    if (status === 'pending') return 'orange' as const;
    return 'navy' as const;
}

function viRecordStatus(status: string) {
    const map: Record<string, string> = {
        approved: 'Đã phê duyệt',
        rejected: 'Bị từ chối',
        pending: 'Chờ duyệt',
        draft: 'Nháp',
    };
    return map[status] || status;
}

export default function RecordsPage() {
    const [tab, setTab] = useState(tabs[0]);
    const [rows, setRows] = useState<Row[]>([]);
    const [status, setStatus] = useState('approved');
    const [name, setName] = useState('');

    const load = () => api.get(tab.list).then((r) => setRows(r.data ?? [])).catch(() => setRows([]));
    useEffect(() => { load(); }, [tab]);

    return (
        <div className="space-y-6">
            <PageHead
                title="Hồ sơ vận hành"
                description="Theo dõi phiếu khảo sát, phản ánh, kế hoạch tuyến và kịch bản."
                extra={
                    tab.id === 'scenarios' ? (
                        <form className="flex gap-2" onSubmit={async (e) => { e.preventDefault(); await api.post('/scenarios', { name, kind: 'policy' }); setName(''); load(); }}>
                            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tên kịch bản" />
                            <Button type="submit"><Plus size={16} className="mr-1" /> Thêm hồ sơ</Button>
                        </form>
                    ) : tab.id === 'surveys' ? (
                        <form className="flex gap-2" onSubmit={async (e) => { e.preventDefault(); await api.post('/surveys/forms/shipper/responses', { answers: { note: status } }); load(); }}>
                            <Input value={status} onChange={(e) => setStatus(e.target.value)} placeholder="Ghi chú phiếu" />
                            <Button type="submit"><Plus size={16} className="mr-1" /> Thêm hồ sơ</Button>
                        </form>
                    ) : undefined
                }
            />

            <DataCard>
                <div className="flex gap-1 border-b border-[#e4e8f1] px-5">
                    {tabs.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            className={`-mb-px border-b-2 px-4 py-3 text-sm font-medium ${tab.id === item.id ? 'border-[#2f6bff] text-[#2f6bff]' : 'border-transparent text-[#66728b]'}`}
                            onClick={() => setTab(item)}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
                <DataTable
                    columns={[
                        { key: 'code', header: 'Mã hồ sơ', render: (row) => String(row.code || row.siteCode || `HS-${row.id}`) },
                        { key: 'content', header: 'Nội dung', render: (row) => String(row.siteCode || row.issueType || row.name || row.note || '') },
                        { key: 'status', header: 'Trạng thái', render: (row) => {
                            const rawStatus = String(row.status || row.kind || '');
                            return <SoftTag tone={statusTone(rawStatus)}>{viRecordStatus(rawStatus) || '—'}</SoftTag>;
                        } },
                        { key: 'updatedAt', header: 'Cập nhật', render: (row) => row.updatedAt ? new Date(String(row.updatedAt)).toLocaleDateString('vi-VN') : '—' },
                        { key: 'actions', header: '', render: (row) => (
                            <div className="flex justify-end gap-2">
                                <button className="admin-ghost" type="button" onClick={async () => {
                                    const next = window.prompt('Trạng thái hoặc tên mới', String(row.status || row.name || ''));
                                    if (!next) return;
                                    const body = row.name != null ? { name: next } : { status: next };
                                    await tab.update(row.id, body);
                                    load();
                                }}><MoreHorizontal size={16} /></button>
                                <button className="text-xs text-red-600" type="button" onClick={async () => { await tab.remove(row.id); load(); }}>Xóa</button>
                            </div>
                        ) },
                    ] satisfies Column<Row>[]}
                    data={rows}
                    emptyMessage="Chưa có hồ sơ"
                />
            </DataCard>
        </div>
    );
}
