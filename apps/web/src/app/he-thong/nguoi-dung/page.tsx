'use client';

import Link from 'next/link';
import { PageHead, StudioShell, adminNav } from '@/components/studio/shell';

const users = [
    ['[Họ tên]', 'Thành viên', '—', 'Hoàn Kiếm · 7/15', 'Hoạt động'],
    ['[Họ tên]', 'Nghiên cứu', 'ĐH GTVT', '—', 'Hoạt động'],
    ['[Họ tên]', 'Cơ quan quản lý', 'Sở [tên]', '—', 'Tạm khoá'],
    ['[Họ tên]', 'Doanh nghiệp · Nhân viên', 'DN A', 'Cầu Giấy · 3/10', 'Đã khoá'],
];
const orgs = [
    ['DN A', 'Chuyển phát nhanh', '4', 'Có', 'Có'],
    ['Đơn vị quản lý', 'Cơ quan quản lý', '2', '—', '—'],
    ['ĐH Giao thông vận tải', 'Trường đại học', '9', '—', '—'],
];

export default function UsersAdminPage() {
    return (
        <StudioShell group="QUẢN TRỊ HỆ THỐNG" role="Quản trị hệ thống" items={adminNav}>
            <PageHead title="Người dùng & tổ chức" extra={<><Link href="/logistics/carriers" className="rounded-lg border bg-white px-3 py-1.5 text-sm">+ Tổ chức</Link><Link href="/register" className="rounded-lg bg-[#0e6e5c] px-3 py-1.5 text-sm text-white">Mời người dùng</Link></>} />
            <div className="grid gap-4 px-6 pb-6 xl:grid-cols-[1fr_280px]">
                <div className="space-y-4">
                    <div className="flex gap-2 text-sm"><input className="rounded-lg border bg-white px-3 py-1.5" placeholder="Tìm người dùng" /><select className="rounded-lg border bg-white px-2"><option>Vai trò</option></select><label className="flex items-center gap-2 text-xs"><input type="checkbox" /> Đang có nhiệm vụ khảo sát</label></div>
                    <table className="w-full rounded-2xl bg-white text-sm">
                        <thead className="text-left text-xs text-[#7b8781]"><tr><th className="px-3 py-2">Người dùng</th><th>Vai trò</th><th>Tổ chức</th><th>Nhiệm vụ KS</th><th>Trạng thái</th></tr></thead>
                        <tbody>{users.map((r) => <tr key={r.join()} className="border-t">{r.map((c) => <td key={c} className="px-3 py-2">{c}</td>)}</tr>)}</tbody>
                    </table>
                    <table className="w-full rounded-2xl bg-white text-sm">
                        <thead className="text-left text-xs text-[#7b8781]"><tr><th className="px-3 py-2">Tổ chức</th><th>Loại</th><th>Thành viên</th><th>Đã đối soát dữ liệu</th><th>Ẩn tên công khai</th></tr></thead>
                        <tbody>{orgs.map((r) => <tr key={r[0]} className="border-t">{r.map((c) => <td key={c} className="px-3 py-2">{c}</td>)}</tr>)}</tbody>
                    </table>
                </div>
                <form className="h-fit rounded-2xl bg-white p-4 text-sm">
                    <h2 className="font-semibold">[Họ tên]</h2>
                    <label className="mt-2 block text-xs">Vai trò<select className="mt-1 w-full rounded border px-2 py-1"><option>Thành viên</option><option>Nghiên cứu</option><option>Cơ quan quản lý</option><option>Quản trị DN</option></select></label>
                    <label className="mt-2 block text-xs">Tổ chức<select className="mt-1 w-full rounded border px-2 py-1"><option>DN A</option></select></label>
                    <p className="mt-3 text-xs text-[#56635d]">Cấp trạng thái doanh nghiệp: Quản trị DN hoặc Nhân viên. Không gán thêm vai trò khảo sát — nhiệm vụ là một việc được giao.</p>
                    <div className="mt-4 flex gap-2"><button type="button" className="rounded-lg border px-3 py-1.5 text-red-700">Khoá</button><Link href="/logistics/users" className="rounded-lg bg-[#0e6e5c] px-3 py-1.5 text-white">Lưu</Link></div>
                </form>
            </div>
        </StudioShell>
    );
}
