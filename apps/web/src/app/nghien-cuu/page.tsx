'use client';

import { useEffect, useState } from 'react';
import { api } from '@/api';
import Map from '@/components/shared/map';
import { PageHead, StudioShell, researchNav } from '@/components/studio/shell';

const progress = [['Hoàn Kiếm', '36/60'], ['Cửa Nam', '24/40'], ['Cầu Giấy', '41/40'], ['Giảng Võ', '3/40']];
const pending = [
    ['GRAB_HK_08', 'Shipper', '[Sinh viên A]', 'Hôm qua', '—'],
    ['BE_CN_03', 'Shipper', '[CTV]', '10–15 hôm nay', 'Thiếu câu 4.4'],
    ['AHA_DD_12', 'Shipper', '[Nhân viên ĐH]', 'Hôm qua', 'Trùng mã điểm'],
    ['DN_HK_02', 'DN giao hàng', 'Google Form', 'Hôm qua', '—'],
];

type Row = { id: number; siteCode?: string; status?: string };

export default function ResearchSurveyPage() {
    const [rows, setRows] = useState<Row[]>([]);
    const [message, setMessage] = useState('');
    const load = () => {
        if (!localStorage.getItem('accessToken')) return;
        api.get('/surveys/responses').then((r) => setRows(r.data ?? [])).catch(() => setRows([]));
    };
    useEffect(() => { load(); }, []);
    const shown = rows.length ? rows.slice(0, 8).map((r) => [r.siteCode || `Phiếu ${r.id}`, 'Shipper', '—', r.status || '', '—', String(r.id)]) : pending.map((r) => [...r, '']);
    return (
        <StudioShell group="NGHIÊN CỨU" role="Nghiên cứu viên" items={researchNav}>
            <PageHead title="Khảo sát & duyệt phiếu" extra={<span className="rounded-lg border bg-white px-3 py-1.5 text-sm">Nhập kết quả Google Form</span>} />
            <div className="space-y-4 px-6 pb-6">
                <div className="flex flex-wrap gap-2">{progress.map(([name, n]) => <span key={name} className="rounded-full bg-white px-3 py-1 text-sm">{name} <b>{n}</b></span>)}</div>
                <div className="grid gap-3 lg:grid-cols-[1fr_300px]">
                    <div className="h-64 overflow-hidden rounded-2xl bg-white"><Map className="h-full w-full" center={[105.84, 21.03]} zoom={13} /></div>
                    <form className="rounded-2xl bg-white p-4 text-sm" onSubmit={(e) => { e.preventDefault(); api.post('/surveys/assignments', { userId: 1, formCode: 'shipper', quota: 15 }).then(() => setMessage('Đã giao nhiệm vụ.')).catch(() => setMessage('Cần đăng nhập nghiên cứu viên.')); }}>
                        <h2 className="font-semibold">Giao nhiệm vụ khảo sát</h2>
                        <p className="mt-1 text-xs text-[#7b8781]">Giao được cho bất kỳ tài khoản thành viên, thành viên phường, cả nhân viên DN.</p>
                        <label className="mt-2 block text-xs">Người nhận<input className="mt-1 w-full rounded border px-2 py-1" placeholder="email hoặc tên" /></label>
                        <div className="mt-2 grid grid-cols-2 gap-2"><label className="text-xs">Phường<input className="mt-1 w-full rounded border px-2 py-1" defaultValue="Hoàn Kiếm" /></label><label className="text-xs">Mẫu phiếu<input className="mt-1 w-full rounded border px-2 py-1" defaultValue="shipper" /></label></div>
                        <div className="mt-2 grid grid-cols-2 gap-2"><label className="text-xs">Số phiếu<input className="mt-1 w-full rounded border px-2 py-1" defaultValue="15" /></label><label className="text-xs">Hạn<input className="mt-1 w-full rounded border px-2 py-1" type="date" /></label></div>
                        <button className="mt-3 w-full rounded-lg bg-[#0e6e5c] py-2 text-white" type="submit">Giao nhiệm vụ</button>
                        {message && <p className="mt-2 text-xs">{message}</p>}
                    </form>
                </div>
                <section className="rounded-2xl bg-white p-4 text-sm">
                    <p className="font-semibold">Phiếu chờ duyệt · {rows.length || 4}</p>
                    <p className="text-xs text-[#7b8781]">Hệ thống tự gắn cờ phiếu thiếu câu, trùng mã, đủ ngưỡng k-ẩn danh.</p>
                    <table className="mt-2 w-full">
                        <thead className="text-left text-xs text-[#7b8781]"><tr><th className="py-2">Mã</th><th>Người nộp</th><th>Thời gian</th><th>Cờ</th><th></th></tr></thead>
                        <tbody>
                            {shown.map((r) => (
                                <tr key={r[0]} className="border-t">
                                    <td className="py-2">{r[0]}</td><td>{r[1]} {r[2]}</td><td>{r[3]}</td><td>{r[4]}</td>
                                    <td className="space-x-2 text-right">
                                        <button type="button" className="text-[#0e6e5c]" onClick={() => r[5] && api.patch(`/surveys/responses/${r[5]}`, { status: 'approved' }).then(load)}>Duyệt</button>
                                        <button type="button">Loại</button>
                                        <button type="button" onClick={() => r[5] && api.delete(`/surveys/responses/${r[5]}`).then(load)}>Xoá</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
            </div>
        </StudioShell>
    );
}
