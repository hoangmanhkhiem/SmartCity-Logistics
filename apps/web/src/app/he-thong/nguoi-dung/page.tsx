'use client';

import { FormEvent, useEffect, useState } from 'react';
import { PageHead, StudioShell, adminNav, roleLabel } from '@/components/studio/shell';
import { organizationApi, userApi } from '@/api';
import { useToast, getErrorMessage } from '@/components/ui';
import type { Organization } from '@/types';

type Membership = { organization?: { name?: string; type?: string }; role?: { name?: string; displayName?: string } };
type UserRow = { id: number; name: string; email: string; isActive?: boolean; memberships?: Membership[] };

export default function UsersAdminPage() {
    const { showToast } = useToast();
    const [users, setUsers] = useState<UserRow[]>([]);
    const [orgs, setOrgs] = useState<Organization[]>([]);
    const [q, setQ] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [selected, setSelected] = useState<UserRow | null>(null);
    const [orgForm, setOrgForm] = useState({ name: '', type: 'delivery', email: '' });

    const load = () => {
        userApi.getAll({ limit: 100 }).then((r) => setUsers(r.data.data ?? r.data)).catch(() => showToast('Cần tài khoản quản trị để xem người dùng'));
        organizationApi.getAll({ limit: 100 }).then((r) => setOrgs(r.data.data ?? r.data)).catch(() => undefined);
    };
    useEffect(() => { load(); }, []);

    const filtered = users.filter((u) => {
        const role = u.memberships?.[0]?.role?.name || '';
        const matchQ = `${u.name} ${u.email}`.toLowerCase().includes(q.toLowerCase());
        const matchR = !roleFilter || role === roleFilter;
        return matchQ && matchR;
    });

    const saveOrg = async (e: FormEvent) => {
        e.preventDefault();
        try {
            await organizationApi.create(orgForm);
            setOrgForm({ name: '', type: 'delivery', email: '' });
            showToast('Đã tạo tổ chức', 'success');
            load();
        } catch (error) { showToast(getErrorMessage(error, 'Không tạo được tổ chức')); }
    };

    return (
        <StudioShell group="QUẢN TRỊ HỆ THỐNG" role="Quản trị hệ thống" items={adminNav}>
            <PageHead title="Người dùng & tổ chức" extra={<a href="/register" className="rounded-lg bg-[#0e6e5c] px-3 py-1.5 text-sm text-white">Mời / đăng ký</a>} />
            <div className="grid gap-4 px-6 pb-6 xl:grid-cols-[1fr_280px]">
                <div className="space-y-4">
                    <div className="flex gap-2 text-sm">
                        <input className="rounded-lg border bg-white px-3 py-1.5" placeholder="Tìm người dùng" value={q} onChange={(e) => setQ(e.target.value)} />
                        <select className="rounded-lg border bg-white px-2" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                            <option value="">Mọi vai trò</option>
                            {['platform_admin', 'sys_admin', 'regulator', 'org_admin', 'researcher', 'member', 'shipper', 'consumer'].map((r) => <option key={r} value={r}>{roleLabel(r)}</option>)}
                        </select>
                    </div>
                    <table className="w-full rounded-2xl bg-white text-sm">
                        <thead className="text-left text-xs text-[#7b8781]"><tr><th className="px-3 py-2">Người dùng</th><th>Vai trò</th><th>Tổ chức</th><th>Trạng thái</th></tr></thead>
                        <tbody>
                            {filtered.map((u) => (
                                <tr key={u.id} className="border-t cursor-pointer" onClick={() => setSelected(u)}>
                                    <td className="px-3 py-2">{u.name}<div className="text-xs text-[#7b8781]">{u.email}</div></td>
                                    <td>{roleLabel(u.memberships?.[0]?.role?.name)}</td>
                                    <td>{u.memberships?.[0]?.organization?.name || '—'}</td>
                                    <td>{u.isActive === false ? 'Khoá' : 'Hoạt động'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <table className="w-full rounded-2xl bg-white text-sm">
                        <thead className="text-left text-xs text-[#7b8781]"><tr><th className="px-3 py-2">Tổ chức</th><th>Loại</th><th>Liên hệ</th><th></th></tr></thead>
                        <tbody>
                            {orgs.map((o) => (
                                <tr key={o.id} className="border-t">
                                    <td className="px-3 py-2">{o.name}</td>
                                    <td>{o.type}</td>
                                    <td>{o.email || o.phone || '—'}</td>
                                    <td><button type="button" className="text-red-700" onClick={async () => { await organizationApi.delete(o.id); load(); }}>Xóa</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="space-y-3">
                    <form className="h-fit rounded-2xl bg-white p-4 text-sm" onSubmit={async (e) => {
                        e.preventDefault();
                        if (!selected) return;
                        try {
                            await userApi.update(selected.id, { isActive: selected.isActive === false });
                            showToast(selected.isActive === false ? 'Đã mở khoá' : 'Đã khoá', 'success');
                            load();
                        } catch (error) { showToast(getErrorMessage(error, 'Không đổi được trạng thái')); }
                    }}>
                        <h2 className="font-semibold">{selected?.name || 'Chọn người dùng'}</h2>
                        <p className="mt-1 text-xs text-[#7b8781]">{selected?.email}</p>
                        <p className="mt-2 text-xs">{roleLabel(selected?.memberships?.[0]?.role?.name)} · {selected?.memberships?.[0]?.organization?.name || '—'}</p>
                        <button type="submit" disabled={!selected} className="mt-4 rounded-lg border px-3 py-1.5 text-red-700 disabled:opacity-40">{selected?.isActive === false ? 'Mở khoá' : 'Khoá'}</button>
                    </form>
                    <form className="rounded-2xl bg-white p-4 text-sm" onSubmit={saveOrg}>
                        <h2 className="font-semibold">+ Tổ chức</h2>
                        <label className="mt-2 block text-xs">Tên<input className="mt-1 w-full rounded border px-2 py-1" value={orgForm.name} onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })} required /></label>
                        <label className="mt-2 block text-xs">Loại<select className="mt-1 w-full rounded border px-2 py-1" value={orgForm.type} onChange={(e) => setOrgForm({ ...orgForm, type: e.target.value })}><option value="delivery">Giao hàng</option><option value="government">Cơ quan</option><option value="university">Trường</option><option value="platform">Nền tảng</option></select></label>
                        <label className="mt-2 block text-xs">Email<input className="mt-1 w-full rounded border px-2 py-1" value={orgForm.email} onChange={(e) => setOrgForm({ ...orgForm, email: e.target.value })} /></label>
                        <button className="mt-3 w-full rounded-lg bg-[#0e6e5c] py-2 text-white" type="submit">Tạo</button>
                    </form>
                </div>
            </div>
        </StudioShell>
    );
}
