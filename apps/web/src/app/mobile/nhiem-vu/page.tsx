'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/api';

const vehicles = ['Xe máy xăng', 'Xe máy điện', 'Xe đạp điện', 'Khác'];

export default function MobileSurveyPage() {
    const [vehicle, setVehicle] = useState('Xe máy xăng');
    const [score, setScore] = useState(4);
    const [message, setMessage] = useState('');
    return (
        <main className="mx-auto min-h-screen max-w-md bg-[#eef2ef] text-[#14211c]">
            <header className="bg-[#14352c] px-4 py-4 text-white">
                <Link href="/mobile" className="text-sm text-[#d5e4dc]">← Nhiệm vụ · Phường Hoàn Kiếm</Link>
                <h1 className="mt-1 text-lg font-semibold">Phiếu shipper · 7/15 phiếu</h1>
                <div className="mt-2 flex justify-between text-[11px] text-[#9fb3aa]"><span>Mã điểm: GRAB_HK_08 · GPS ±6 m</span><span>Hạn: [ngày]</span></div>
            </header>
            <div className="space-y-3 p-4">
                <div className="flex items-center justify-between text-xs"><span className="text-[#0e6e5c]">Phần 3/6 · Hạ tầng giao thông</span><span className="text-[#c2410c]">● Ngoài tuyến · đã lưu trên máy</span></div>
                <section className="rounded-2xl bg-white p-4">
                    <h2 className="font-semibold">3.1 Anh/chị chạy xe gì là chính?</h2>
                    {vehicles.map((item) => (
                        <label key={item} className="mt-3 flex items-center gap-2 text-sm"><input type="radio" name="xe" checked={vehicle === item} onChange={() => setVehicle(item)} /> {item}</label>
                    ))}
                </section>
                <section className="rounded-2xl bg-white p-4">
                    <h2 className="font-semibold">3.2 Dừng đỗ để giao/nhận ở nội đô khó cỡ nào?</h2>
                    <div className="mt-3 flex justify-between gap-2">
                        {[1, 2, 3, 4, 5].map((n) => (
                            <button key={n} type="button" onClick={() => setScore(n)} className={`h-11 flex-1 rounded-xl border ${score === n ? 'border-[#0e6e5c] bg-[#0e6e5c] text-white' : ''}`}>{n}</button>
                        ))}
                    </div>
                    <div className="mt-1 flex justify-between text-[11px] text-[#7b8781]"><span>1 · Dễ</span><span>5 · Rất khó</span></div>
                </section>
                <section className="rounded-2xl bg-white p-4 text-sm">
                    <h2 className="font-semibold">3.4 Khó khăn hay gặp nhất khi chạy nội đô? (chọn nhiều)</h2>
                    <label className="mt-3 flex items-center gap-2"><input type="checkbox" defaultChecked /> Ùn tắc</label>
                </section>
                <div className="grid grid-cols-2 gap-2 pb-4">
                    <Link href="/mobile" className="rounded-xl border bg-white py-3 text-center">Quay lại</Link>
                    <button className="rounded-xl bg-[#0e6e5c] py-3 font-semibold text-white" type="button" onClick={() => api.post('/surveys/forms/shipper/responses', { answers: { vehicle, parkingDifficulty: score, issue: 'un_tac' }, siteCode: 'GRAB_HK_08' }).then(() => setMessage('Đã lưu phiếu trên máy và gửi khi có mạng.')).catch(() => setMessage('Cần đăng nhập tài khoản được giao nhiệm vụ.'))}>Tiếp: Đơn hàng</button>
                </div>
                {message && <p className="text-sm">{message}</p>}
            </div>
        </main>
    );
}
