'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/api';
import { PageHead, StudioShell, adminNav } from '@/components/studio/shell';

type Quota = { used: number; limit: number; stopped: boolean; note: string };

const jobs = [
    ['refresh_agg_speed', 'Xong', '100%', '03:10', 'Mỗi đêm'],
    ['import_google_form · shipper', 'Đang chạy', '64%', '10:12', '[người]'],
    ['vrp_plan · DN A', 'Lỗi · quá thời gian', '—', '09:40', 'Nhân viên DN'],
];

export default function SystemDataPage() {
    const [quota, setQuota] = useState<Quota | null>(null);
    const [message, setMessage] = useState('');
    useEffect(() => { api.get('/traffic/quota').then((r) => setQuota(r.data)).catch(() => undefined); }, []);
    return (
        <StudioShell group="QUẢN TRỊ HỆ THỐNG" role="Quản trị hệ thống" items={adminNav}>
            <PageHead title="Dữ liệu nền & hệ thống" />
            <div className="space-y-4 px-6 pb-6">
                <div className="grid gap-3 md:grid-cols-4">
                    <article className="rounded-2xl bg-white p-4 text-sm"><h2 className="font-semibold">Ranh giới phường</h2><p className="mt-1 text-xs text-[#56635d]">Ranh giới sau sáp nhập · GeoJSON EPSG:4326</p><p className="mt-2 text-xs text-[#0e6e5c]">Cập nhật [ngày]</p><button type="button" className="mt-3 rounded-lg border px-2 py-1 text-xs">Nhập file mới</button></article>
                    <article className="rounded-2xl bg-white p-4 text-sm"><h2 className="font-semibold">OSM đường & điểm</h2><p className="mt-1 text-xs text-[#56635d]">Bản đồ nền Mapbox. Tốc độ do TomTom, không dùng Google.</p><p className="mt-2 text-xs">{quota ? `${quota.used}/${quota.limit} lượt · ${quota.stopped ? 'đã dừng 90%' : 'còn hạn mức'}` : 'Đang đọc hạn mức'}</p><button type="button" className="mt-3 text-xs text-[#0e6e5c]" onClick={() => api.post('/traffic/sample').then(() => setMessage('Đã lấy mẫu.')).catch(() => setMessage('Cần đăng nhập quản trị.'))}>Tải lại / dừng OSM</button></article>
                    <article className="rounded-2xl bg-white p-4 text-sm"><h2 className="font-semibold">Hệ số phát thải</h2><p className="mt-1 text-xs text-[#56635d]">g/km theo loại xe và nhiên liệu.</p><Link href="/logistics/emissions" className="mt-3 inline-block text-xs text-[#0e6e5c]">Sửa danh mục</Link></article>
                    <article className="rounded-2xl bg-white p-4 text-sm"><h2 className="font-semibold">Danh mục đáp án khảo sát</h2><p className="mt-1 text-xs text-[#56635d]">Mẫu phiếu ×3 · Google Form</p><Link href="/nghien-cuu" className="mt-3 inline-block text-xs text-[#0e6e5c]">Duyệt phiên bản</Link></article>
                </div>
                <section className="rounded-2xl bg-white p-4 text-sm">
                    <h2 className="font-semibold">Công việc nền</h2>
                    <table className="mt-2 w-full">
                        <thead className="text-left text-xs text-[#7b8781]"><tr><th className="py-2">Job</th><th>Trạng thái</th><th>Tiến độ</th><th>Bắt đầu</th><th>Người chạy</th></tr></thead>
                        <tbody>{jobs.map((r) => <tr key={r[0]} className="border-t">{r.map((c) => <td key={c} className="py-2">{c}</td>)}</tr>)}</tbody>
                    </table>
                    {message && <p className="mt-2 text-xs">{message}</p>}
                    {quota && <p className="mt-2 text-xs text-[#56635d]">{quota.note}</p>}
                </section>
                <section className="rounded-2xl bg-white p-4 text-sm">
                    <h2 className="font-semibold">Dịch vụ</h2>
                    <div className="mt-3 flex flex-wrap gap-4 text-xs">{['api', 'web', 'worker', 'optimizer', 'osrm', 'mysql', 'redis'].map((name) => <span key={name} className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#16a34a]" />{name}</span>)}</div>
                    <p className="mt-3 text-[11px] text-[#7b8781]">Backup gần nhất: mysqldump. OSRM/OR-Tools chưa tách máy riêng; thời gian Mapbox được nhân hệ số tắc.</p>
                </section>
            </div>
        </StudioShell>
    );
}
