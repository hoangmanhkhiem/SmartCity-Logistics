'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PageHead, StudioShell, orgNav } from '@/components/studio/shell';

const fleet = [
    ['Xe máy xăng', 'Shipper tự do', '120', '30', 'RON95', '[Euro]', '[hệ số]'],
    ['Xe máy điện', 'Công ty', '18', '30', 'Điện', '—', '[hệ số]'],
    ['Ba gác', 'Công ty', '4', '300', 'RON95', '[Euro]', '[hệ số]'],
    ['Ô tô tải nhẹ', 'Công ty', '3', '990', 'Diesel', '[Euro]', '[hệ số]'],
];

export default function FleetPage() {
    const [tab, setTab] = useState('Đội xe');
    return (
        <StudioShell group="DOANH NGHIỆP" role="Quản trị DN" items={orgNav}>
            <PageHead title="Đội xe, kho & người dùng" extra={<><button type="button" className="rounded-lg border bg-white px-3 py-1.5 text-sm">Nhập CSV / GeoJSON</button><Link href="/delivery/fleet" className="rounded-lg bg-[#0e6e5c] px-3 py-1.5 text-sm text-white">+ Thêm mới</Link></>} />
            <div className="px-6 pb-6">
                <p className="text-sm text-[#56635d]">[Tên doanh nghiệp] · Quản trị DN</p>
                <div className="mt-3 flex gap-4 border-b text-sm">
                    {['Đội xe', 'Kho & điểm', 'Người dùng & API key'].map((item) => (
                        <button key={item} type="button" onClick={() => setTab(item)} className={`pb-2 ${tab === item ? 'border-b-2 border-[#0e6e5c] font-semibold text-[#0e6e5c]' : 'text-[#56635d]'}`}>{item}</button>
                    ))}
                </div>
                {tab === 'Đội xe' && (
                    <>
                        <p className="mt-3 text-xs text-[#7b8781]">Khai theo nhóm xe, không cần từng chiếc. Hệ số phát thải lấy theo loại xe và nhiên liệu.</p>
                        <table className="mt-2 w-full overflow-hidden rounded-2xl bg-white text-sm">
                            <thead className="text-left text-xs text-[#7b8781]"><tr><th className="px-4 py-3">Loại xe</th><th>Sở hữu</th><th>Số lượng</th><th>Tải trọng (kg)</th><th>Nhiên liệu</th><th>Tiêu chuẩn</th><th>CO₂e g/km</th><th></th></tr></thead>
                            <tbody>
                                {fleet.map((row) => (
                                    <tr key={row[0]} className="border-t">{row.map((cell, i) => <td key={i} className="px-4 py-3">{cell}</td>)}<td><Link href="/logistics/emissions" className="text-[#0e6e5c]">Sửa</Link></td></tr>
                                ))}
                            </tbody>
                        </table>
                    </>
                )}
                {tab === 'Kho & điểm' && <p className="mt-4 rounded-2xl bg-white p-4 text-sm">Nhập điểm kho bằng CSV hoặc vẽ trên <Link className="text-[#0e6e5c] underline" href="/logistics/facilities">bản đồ cơ sở</Link>.</p>}
                {tab === 'Người dùng & API key' && <p className="mt-4 rounded-2xl bg-white p-4 text-sm">Thu hồi hoặc xoá khoá tại <Link className="text-[#0e6e5c] underline" href="/logistics/integrations">tích hợp API</Link>.</p>}
            </div>
        </StudioShell>
    );
}
