'use client';

import { FormEvent, useEffect, useState } from 'react';
import { api, userApi } from '@/api';
import Map from '@/components/shared/map';
import { PageHead, StudioShell, researchNav } from '@/components/studio/shell';

type Row = { id: number; siteCode?: string; status?: string; submittedBy?: number };
type Progress = { zoneName?: string; counts?: Array<{ status: string; n: number }> };
type UserRow = { id: number; name: string; email: string };

export default function ResearchSurveyPage() {
    const [rows, setRows] = useState<Row[]>([]);
    const [progress, setProgress] = useState<Progress[]>([]);
    const [users, setUsers] = useState<UserRow[]>([]);
    const [message, setMessage] = useState('');
    const [assign, setAssign] = useState({ userId: '', formCode: 'shipper', quota: '15', dueDate: '' });

    const load = () => {
        api.get('/surveys/responses').then((r) => setRows(r.data ?? [])).catch(() => setRows([]));
        api.get('/phases/surveys/progress-by-zone').then((r) => setProgress(r.data ?? [])).catch(() => undefined);
        userApi.getAll({ limit: 100 }).then((r) => setUsers(r.data.data ?? r.data)).catch(() => undefined);
    };
    useEffect(() => { load(); }, []);

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

    return (
        <StudioShell group="NGHIÊN CỨU" role="Nghiên cứu viên" items={researchNav}>
            <PageHead title="Khảo sát & duyệt phiếu" extra={
                <>
                    <input type="file" accept=".csv" className="hidden" id="gf-csv" onChange={(e) => { const f = e.target.files?.[0]; if (f) importCsv(f); e.target.value = ''; }} />
                    <label htmlFor="gf-csv" className="cursor-pointer rounded-lg border bg-white px-3 py-1.5 text-sm">Nhập CSV Google Form</label>
                </>
            } />
            <div className="space-y-4 px-6 pb-6">
                <div className="flex flex-wrap gap-2">
                    {progress.map((p) => {
                        const n = (p.counts ?? []).reduce((s, c) => s + c.n, 0);
                        return <span key={p.zoneName} className="rounded-full bg-white px-3 py-1 text-sm">{p.zoneName} <b>{n}</b></span>;
                    })}
                </div>
                <div className="grid gap-3 lg:grid-cols-[1fr_300px]">
                    <div className="h-64 overflow-hidden rounded-2xl bg-white"><Map className="h-full w-full" center={[105.84, 21.03]} zoom={13} /></div>
                    <form className="rounded-2xl bg-white p-4 text-sm" onSubmit={submitAssign}>
                        <h2 className="font-semibold">Giao nhiệm vụ khảo sát</h2>
                        <label className="mt-2 block text-xs">Người nhận
                            <select className="mt-1 w-full rounded border px-2 py-1" value={assign.userId} onChange={(e) => setAssign({ ...assign, userId: e.target.value })} required>
                                <option value="">Chọn tài khoản</option>
                                {users.map((u) => <option key={u.id} value={u.id}>{u.name} · {u.email}</option>)}
                            </select>
                        </label>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                            <label className="text-xs">Mẫu phiếu<input className="mt-1 w-full rounded border px-2 py-1" value={assign.formCode} onChange={(e) => setAssign({ ...assign, formCode: e.target.value })} /></label>
                            <label className="text-xs">Số phiếu<input className="mt-1 w-full rounded border px-2 py-1" value={assign.quota} onChange={(e) => setAssign({ ...assign, quota: e.target.value })} /></label>
                        </div>
                        <label className="mt-2 block text-xs">Hạn<input className="mt-1 w-full rounded border px-2 py-1" type="date" value={assign.dueDate} onChange={(e) => setAssign({ ...assign, dueDate: e.target.value })} /></label>
                        <button className="mt-3 w-full rounded-lg bg-[#0e6e5c] py-2 text-white" type="submit">Giao nhiệm vụ</button>
                        {message && <p className="mt-2 text-xs">{message}</p>}
                    </form>
                </div>
                <section className="rounded-2xl bg-white p-4 text-sm">
                    <p className="font-semibold">Phiếu · {rows.length}</p>
                    <table className="mt-2 w-full">
                        <thead className="text-left text-xs text-[#7b8781]"><tr><th className="py-2">Mã</th><th>Trạng thái</th><th></th></tr></thead>
                        <tbody>
                            {rows.map((r) => (
                                <tr key={r.id} className="border-t">
                                    <td className="py-2">{r.siteCode || `Phiếu ${r.id}`}</td>
                                    <td>{r.status}</td>
                                    <td className="space-x-2 text-right">
                                        <button type="button" className="text-[#0e6e5c]" onClick={() => api.patch(`/surveys/responses/${r.id}/review`, { status: 'approved' }).then(load)}>Duyệt</button>
                                        <button type="button" onClick={() => api.patch(`/surveys/responses/${r.id}/review`, { status: 'rejected' }).then(load)}>Loại</button>
                                        <button type="button" onClick={() => api.delete(`/surveys/responses/${r.id}`).then(load)}>Xoá</button>
                                    </td>
                                </tr>
                            ))}
                            {rows.length === 0 && <tr><td className="py-2" colSpan={3}>Chưa có phiếu</td></tr>}
                        </tbody>
                    </table>
                </section>
            </div>
        </StudioShell>
    );
}
