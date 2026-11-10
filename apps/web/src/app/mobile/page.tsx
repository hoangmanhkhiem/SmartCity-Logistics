'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/api';

const kinds = ['Ùn tắc', 'Cấm đường / cấm giờ', 'Không chỗ dừng đỗ', 'Ngõ nhỏ, khó quay đầu', 'Mưa / ngập', 'Sai vị trí bản đồ'];

export default function MobileReportPage() {
    const [kind, setKind] = useState('Ùn tắc');
    const [message, setMessage] = useState('');
    return (
        <main className="mx-auto flex min-h-screen max-w-md flex-col bg-[#e7eee9] text-[#14211c]">
            <div className="relative h-80 bg-[#d5e3cc]">
                <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs shadow"><span className="h-2 w-2 rounded-full bg-[#16a34a]" /> Xe máy xăng · 7:42</div>
                <div className="absolute right-3 top-16 flex flex-col overflow-hidden rounded-lg bg-white text-lg shadow"><span className="px-3 py-1">+</span><span className="border-t px-3 py-1">−</span></div>
                <div className="absolute left-4 right-16 top-14 rounded-xl bg-[#fff4e5] px-3 py-2 text-sm shadow">Sắp vào vùng cấm giờ · đoạn phía trước cấm xe máy xăng đến 9:00</div>
                <div className="absolute left-16 top-36 h-28 w-40 rounded-lg border-2 border-dashed border-[#0e6e5c]" />
                <p className="absolute bottom-3 left-3 text-[11px] text-[#3f4a45]">© OpenStreetMap contributors</p>
            </div>
            <section className="-mt-6 flex-1 rounded-t-3xl bg-white px-5 pb-4 pt-5">
                <div className="flex items-baseline justify-between">
                    <h1 className="text-lg font-semibold">Báo nhanh tại vị trí này</h1>
                    <span className="text-xs text-[#7b8781]">1 chạm</span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                    {kinds.map((item) => (
                        <button key={item} type="button" onClick={() => setKind(item)} className={`rounded-xl border px-3 py-3 text-left text-sm ${kind === item ? 'border-[#0e6e5c] bg-[#e7f3ee]' : 'border-[#e4ebe6]'}`}>{item}</button>
                    ))}
                </div>
                <p className="mt-3 text-xs text-[#7b8781]">Không lưu tên hay số điện thoại. Có thể thêm ảnh sau.</p>
                <button className="mt-4 w-full rounded-xl bg-[#0e6e5c] py-3 font-semibold text-white" type="button" onClick={() => api.post('/issues', { issueType: kind, latitude: 21.028, longitude: 105.852, note: kind }).then(() => setMessage('Đã gửi phản ánh.')).catch(() => setMessage('Cần đăng nhập thành viên trước khi gửi.'))}>Gửi báo cáo</button>
                {message && <p className="mt-2 text-sm">{message}</p>}
            </section>
            <nav className="grid grid-cols-4 border-t bg-white py-3 text-center text-[11px]">
                <Link href="/thanh-vien/ban-do">Bản đồ</Link>
                <Link href="/mobile" className="font-semibold text-[#0e6e5c]">Báo nghẽn</Link>
                <Link href="/mobile/nhiem-vu">Nhiệm vụ</Link>
                <Link href="/login">Tài khoản</Link>
            </nav>
        </main>
    );
}
