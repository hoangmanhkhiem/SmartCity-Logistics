'use client';

import { useEffect, useState } from 'react';
import { api } from '@/api';

type Row = Record<string, unknown> & { id: number };

const tabs = [
    { id: 'surveys', label: 'Phiếu khảo sát', list: '/surveys/responses', update: (id: number, body: object) => api.patch(`/surveys/responses/${id}`, body), remove: (id: number) => api.delete(`/surveys/responses/${id}`) },
    { id: 'issues', label: 'Phản ánh', list: '/issues', update: (id: number, body: object) => api.patch(`/issues/${id}`, body), remove: (id: number) => api.delete(`/issues/${id}`) },
    { id: 'plans', label: 'Kế hoạch tuyến', list: '/plans', update: (id: number, body: object) => api.patch(`/plans/${id}`, body), remove: (id: number) => api.delete(`/plans/${id}`) },
    { id: 'scenarios', label: 'Kịch bản', list: '/scenarios', update: (id: number, body: object) => api.patch(`/scenarios/${id}`, body), remove: (id: number) => api.delete(`/scenarios/${id}`) },
];

export default function RecordsPage() {
    const [tab, setTab] = useState(tabs[0]);
    const [rows, setRows] = useState<Row[]>([]);
    const [status, setStatus] = useState('approved');
    const [name, setName] = useState('');

    const load = () => api.get(tab.list).then((r) => setRows(r.data ?? [])).catch(() => setRows([]));
    useEffect(() => { load(); }, [tab]);

    return (
        <div className="space-y-4">
            <h1 className="text-xl font-semibold">Hồ sơ vận hành</h1>
            <div className="flex gap-2">
                {tabs.map((item) => (
                    <button key={item.id} className={`rounded px-3 py-1 text-sm ${tab.id === item.id ? 'bg-indigo-600 text-white' : 'border'}`} onClick={() => setTab(item)}>{item.label}</button>
                ))}
            </div>
            <table className="w-full text-sm">
                <thead><tr className="text-left text-slate-500"><th>ID</th><th>Nội dung</th><th></th></tr></thead>
                <tbody>
                    {rows.map((row) => (
                        <tr key={row.id} className="border-t">
                            <td className="py-2">{row.id}</td>
                            <td className="max-w-xl truncate">{String(row.siteCode || row.issueType || row.name || row.status || '')} · {String(row.status || row.kind || '')}</td>
                            <td className="space-x-2">
                                <button className="text-indigo-600" onClick={async () => {
                                    const next = window.prompt('Trạng thái hoặc tên mới', String(row.status || row.name || ''));
                                    if (!next) return;
                                    const body = row.name != null ? { name: next } : { status: next };
                                    await tab.update(row.id, body);
                                    load();
                                }}>Sửa</button>
                                <button className="text-red-600" onClick={async () => { await tab.remove(row.id); load(); }}>Xóa</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {tab.id === 'scenarios' && (
                <form className="flex gap-2" onSubmit={async (e) => { e.preventDefault(); await api.post('/scenarios', { name, kind: 'policy' }); setName(''); load(); }}>
                    <input className="rounded border px-2 py-1" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tên kịch bản" />
                    <button className="rounded bg-indigo-600 px-3 py-1 text-white">Thêm</button>
                </form>
            )}
            {tab.id === 'surveys' && (
                <form className="flex gap-2" onSubmit={async (e) => { e.preventDefault(); await api.post('/surveys/forms/shipper/responses', { answers: { note: status } }); load(); }}>
                    <input className="rounded border px-2 py-1" value={status} onChange={(e) => setStatus(e.target.value)} placeholder="Ghi chú phiếu" />
                    <button className="rounded bg-indigo-600 px-3 py-1 text-white">Thêm phiếu</button>
                </form>
            )}
        </div>
    );
}
