'use client';

import { useState } from 'react';
import { api } from '@/api';
import Map from '@/components/shared/map';
import { PageHead, StudioShell, regulatorNav } from '@/components/studio/shell';

const metrics = [
    ['Tổng đường chạy', '2.140 km', '2.270 km', '+3,1%'],
    ['CO₂e', '[kg]', '[kg]', '−11%'],
    ['Giao đúng giờ', '91%', '88%', '−3 điểm'],
    ['Đơn phải đổi tuyến', '—', '214', '2 chiều'],
    ['Điểm sạc / đỗ cần thêm', '—', '9', '—'],
];

export default function PolicySimPage() {
    const [ran, setRan] = useState(false);
    const [message, setMessage] = useState('');
    return (
        <StudioShell group="CƠ QUAN QUẢN LÝ" role="Cơ quan quản lý" items={regulatorNav}>
            <PageHead title="Mô phỏng tác động chính sách" />
            <div className="grid gap-4 px-6 pb-6 xl:grid-cols-[280px_1fr]">
                <section className="rounded-2xl bg-white p-4 text-sm">
                    <p className="text-xs text-[#7b8781]">Kịch bản B</p>
                    <ul className="mt-2 space-y-2">
                        <li><span className="font-semibold">Mở rộng LEZ</span><br />Thêm vùng cấm xe máy xăng</li>
                        <li><span className="font-semibold">Đổi khung cấm giờ</span><br />Kéo sớm 30 phút</li>
                        <li><span className="font-semibold">Thêm điểm đỗ giao nhận</span><br />12 điểm mới trong vùng</li>
                    </ul>
                    <p className="mt-3 rounded-lg bg-[#e7f3ee] p-2 text-xs text-[#0e6e5c]">Tăng xe điện · Chuyển 10% xe máy xăng sang điện</p>
                    <p className="mt-3 text-xs text-[#56635d]">Tỷ lệ xe máy chuyển sang điện: 40% giả định. Điều này lấy từ phiếu shipper (n=120) và giả định 1.000 đơn đã lập tuyến. Độ tin cậy 72%.</p>
                    <button className="mt-4 w-full rounded-xl bg-[#0e6e5c] py-2.5 font-semibold text-white" type="button" onClick={() => api.post('/scenarios', { name: 'LEZ xe máy xăng', kind: 'policy' }).then(() => api.post('/phases/plans/solve')).then(() => setRan(true)).catch(() => setMessage('Cần đăng nhập cơ quan quản lý để chạy A/B.'))}>Chạy so sánh A/B</button>
                    {message && <p className="mt-2 text-xs">{message}</p>}
                </section>
                <div className="space-y-3">
                    <div className="grid gap-3 md:grid-cols-2">
                        <div><p className="mb-1 text-sm font-semibold">A · hiện trạng</p><div className="h-52 overflow-hidden rounded-2xl bg-white"><Map className="h-full w-full" center={[105.85, 21.03]} zoom={13.6} showZonesAndRestrictions /></div></div>
                        <div><p className="mb-1 text-sm font-semibold">B · tăng xe điện</p><div className="h-52 overflow-hidden rounded-2xl bg-white"><Map className="h-full w-full" center={[105.85, 21.03]} zoom={13.6} /></div></div>
                    </div>
                    <table className="w-full rounded-2xl bg-white text-sm">
                        <thead className="text-left text-xs text-[#7b8781]"><tr><th className="px-4 py-2">Chỉ số (1.000 đơn)</th><th>A · hiện trạng</th><th>B · kịch bản</th><th></th></tr></thead>
                        <tbody>{metrics.map((m) => <tr key={m[0]} className="border-t"><td className="px-4 py-2">{m[0]}</td><td>{ran ? m[1] : '—'}</td><td>{ran ? m[2] : '—'}</td><td className="text-[#0e6e5c]">{ran ? m[3] : ''}</td></tr>)}</tbody>
                    </table>
                    <div className="flex gap-2 text-sm"><button type="button" className="rounded-lg bg-[#14352c] px-3 py-2 text-white">Lưu kịch bản</button><button type="button" className="rounded-lg border bg-white px-3 py-2">Xuất bảng & biểu đồ cho báo cáo</button></div>
                </div>
            </div>
        </StudioShell>
    );
}
