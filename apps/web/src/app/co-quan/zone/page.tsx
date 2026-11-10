'use client';

import Link from 'next/link';
import Map from '@/components/shared/map';
import { PageHead, StudioShell, regulatorNav } from '@/components/studio/shell';

const rules = [
    ['Cấm theo khung giờ', '[Tên tuyến phố]', 'Xe máy xăng, ba gác', '06:00–09:00, 16:30–19:30', 'Đang áp dụng', 'Nội bộ'],
    ['LEZ (thử nghiệm)', 'Vùng vẽ tay', 'Xe máy xăng, ba gác', 'Cả ngày', 'Kích hoạt, chưa áp dụng', 'Nhóm nghiên cứu'],
];

export default function ZonePolicyPage() {
    return (
        <StudioShell group="CƠ QUAN QUẢN LÝ" role="Cơ quan quản lý" items={regulatorNav}>
            <PageHead title="Zone & quy định" extra={<><button type="button" className="rounded-lg border bg-white px-3 py-1.5 text-sm">Nhập GeoJSON</button><Link href="/regulator/restrictions" className="rounded-lg bg-[#0e6e5c] px-3 py-1.5 text-sm text-white">+ Quy định mới</Link></>} />
            <div className="grid gap-4 px-6 pb-6 lg:grid-cols-[1fr_280px]">
                <div className="space-y-3">
                    <div className="flex gap-2 text-sm">{['Vẽ đa giác', 'Chọn đoạn đường', 'Chọn theo phường'].map((item, i) => <span key={item} className={`rounded-full px-3 py-1 ${i === 0 ? 'bg-[#14352c] text-white' : 'bg-white'}`}>{item}</span>)}</div>
                    <div className="h-[380px] overflow-hidden rounded-2xl bg-white"><Map className="h-full w-full" center={[105.851, 21.03]} zoom={14.2} showZonesAndRestrictions drawMode="polygon" /></div>
                    <table className="w-full rounded-2xl bg-white text-sm">
                        <thead className="text-left text-xs text-[#7b8781]"><tr><th className="px-3 py-2">Quy định</th><th>Phạm vi</th><th>Loại xe</th><th>Khung giờ</th><th>Căn cứ</th><th>Trạng thái</th><th>Nguồn</th></tr></thead>
                        <tbody>{rules.map((r) => <tr key={r[0]} className="border-t">{r.map((c) => <td key={c} className="px-3 py-2">{c}</td>)}</tr>)}</tbody>
                    </table>
                </div>
                <form className="h-fit space-y-2 rounded-2xl bg-white p-4 text-sm">
                    <h2 className="font-semibold">Quy định mới · vùng đang vẽ</h2>
                    <p className="text-xs text-[#7b8781]">Áp dụng cho</p>
                    <label className="flex gap-2"><input type="radio" name="xe" defaultChecked /> Xe máy xăng</label>
                    <label className="flex gap-2"><input type="radio" name="xe" /> Xe máy điện</label>
                    <label className="flex gap-2"><input type="radio" name="xe" /> Ba gác</label>
                    <div className="grid grid-cols-2 gap-2"><label>Từ giờ<input className="mt-1 w-full rounded border px-2 py-1" defaultValue="06:00" /></label><label>Đến giờ<input className="mt-1 w-full rounded border px-2 py-1" defaultValue="09:00" /></label></div>
                    <label className="block">Căn cứ pháp lý<input className="mt-1 w-full rounded border px-2 py-1" placeholder="số văn bản" /></label>
                    <label className="block">Hiệu lực từ<input className="mt-1 w-full rounded border px-2 py-1" type="date" /></label>
                    <div className="flex gap-2 pt-2"><button type="button" className="flex-1 rounded-lg border py-2">Mô phỏng tác động</button><Link href="/regulator/restrictions" className="flex-1 rounded-lg bg-[#0e6e5c] py-2 text-center text-white">Lưu quy định</Link></div>
                </form>
            </div>
        </StudioShell>
    );
}
