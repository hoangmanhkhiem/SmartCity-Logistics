'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/api';
import Map from '@/components/shared/map';
import { PageHead, StudioShell } from '@/components/studio/shell';
import type { GeoJsonFeatureCollection } from '@/components/shared/map';

const layers = ['Điểm giao nhận & đỗ', 'Mật độ nghẽn', 'Vùng hạn chế'];

export default function MemberMapPage() {
    const [congestion, setCongestion] = useState<GeoJsonFeatureCollection | null>(null);
    const [active, setActive] = useState(layers[0]);
    useEffect(() => { api.get('/traffic/segments').then((r) => setCongestion(r.data)).catch(() => undefined); }, []);
    return (
        <StudioShell group="THÀNH VIÊN" role="Thành viên" items={[{ href: '/thanh-vien/ban-do', label: 'Bản đồ' }, { href: '/mobile', label: 'Cảnh báo & báo nghẽn (mobile)' }]}>
            <PageHead title="Bản đồ" extra={<span className="rounded-lg bg-white px-3 py-1.5 text-sm">Loại xe ▾</span>} />
            <div className="space-y-3 px-6 pb-6">
                <div className="flex items-center justify-between rounded-xl bg-[#f8ead6] px-4 py-2.5 text-sm">
                    <span>Đang có hạn chế với xe máy xăng: 3 đoạn cấm giờ trong khung nhìn, hiệu lực đến 9:00.</span>
                    <Link href="/cong-khai" className="font-semibold text-[#0e6e5c]">Xem trên bản đồ</Link>
                </div>
                <div className="flex gap-2 text-sm">
                    {layers.map((item) => (
                        <button key={item} type="button" onClick={() => setActive(item)} className={`rounded-full px-3 py-1 ${active === item ? 'bg-[#14352c] text-white' : 'bg-white'}`}>{item}</button>
                    ))}
                </div>
                <div className="grid gap-3 lg:grid-cols-[1fr_280px]">
                    <div className="h-[540px] overflow-hidden rounded-2xl bg-white">
                        <Map className="h-full w-full" center={[105.845, 21.027]} zoom={14} showZonesAndRestrictions congestionGeoJson={active === 'Vùng hạn chế' ? null : congestion} />
                    </div>
                    <aside className="rounded-2xl bg-white p-4 text-sm">
                        <p className="text-xs text-[#7b8781]">Điểm chờ đón</p>
                        <h2 className="text-base font-semibold">[Tên phố / giao lộ]</h2>
                        <p className="text-xs text-[#7b8781]">Phường Hoàn Kiếm · cách bạn 350 m</p>
                        <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                            <div><dt className="text-[#7b8781]">Mức khó đỗ</dt><dd className="font-semibold">4 / 5</dd></div>
                            <div><dt className="text-[#7b8781]">Tình trạng</dt><dd>Chưa xác minh</dd></div>
                            <div><dt className="text-[#7b8781]">Đúng đối giao thông</dt><dd>Có</dd></div>
                            <div><dt className="text-[#7b8781]">Phản ánh 30 ngày</dt><dd>12</dd></div>
                        </dl>
                        <p className="mt-3 text-xs font-semibold">Khó khăn hay gặp</p>
                        <p className="text-xs text-[#56635d]">Không chỗ đỗ · Bị nhắc nhở · Ùn tắc giờ trưa</p>
                        <Link href="/mobile" className="mt-4 block rounded-lg bg-[#0e6e5c] py-2.5 text-center font-semibold text-white">Báo tình trạng điểm này</Link>
                        <Link href="/doanh-nghiep/toi-uu" className="mt-2 block rounded-lg border py-2.5 text-center">Mở mô phỏng tuyến (sandbox)</Link>
                    </aside>
                </div>
                <p className="text-xs text-[#56635d]">Kho / hub · Điểm chờ đón · Điểm đỗ đã xác minh · Đoạn cấm giờ</p>
            </div>
        </StudioShell>
    );
}
