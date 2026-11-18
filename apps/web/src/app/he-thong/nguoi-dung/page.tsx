'use client';

import { FormEvent, useEffect, useState } from 'react';
import { PageHead, roleLabel } from '@/components/studio/shell';
import { MetricStat, DataCard, SoftTag } from '@/components/studio/page-ui';
import { organizationApi, userApi } from '@/api';
import { Button, DataTable, useToast, getErrorMessage, type Column } from '@/components/ui';
import type { Organization } from '@/types';
import { Building2, Search, Users } from 'lucide-react';

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

    const activeCount = users.filter((u) => u.isActive !== false).length;

    return (
        <div className="space-y-6">
            <PageHead
                title="Người dùng & tổ chức"
                description="Quản lý tài khoản, vai trò và tổ chức trên nền tảng."
                extra={<a href="/register" className="admin-primary">Mời / đăng ký</a>}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <MetricStat title="Tổng người dùng" value={users.length} icon={<Users size={17} />} tone="blue" />
                <MetricStat title="Đang hoạt động" value={activeCount} icon={<Users size={17} />} tone="navy" />
                <MetricStat title="Tổ chức" value={orgs.length} icon={<Building2 size={17} />} tone="orange" />
            </div>

            <div className="grid gap-4 xl:grid-cols-[1fr_280px]">
                <div className="space-y-4">
                    <DataCard title="Người dùng">
                        <div className="admin-toolbar">
                            <label className="admin-search">
                                <Search size={16} className="text-[#66728b]" />
                                <input placeholder="Tìm người dùng" value={q} onChange={(e) => setQ(e.target.value)} />
                            </label>
                            <select className="h-10 rounded-[10px] border border-[#e4e8f1] px-3 text-sm" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                                <option value="">Mọi vai trò</option>
                                {['platform_admin', 'sys_admin', 'regulator', 'org_admin', 'researcher', 'member', 'shipper', 'consumer'].map((r) => <option key={r} value={r}>{roleLabel(r)}</option>)}
                            </select>
                        </div>
                        <DataTable
                            data={filtered}
                            emptyMessage="Chưa có người dùng"
                            onRowClick={setSelected}
                            rowClassName={(u) => selected?.id === u.id ? 'bg-[#e6f4ff]' : ''}
                            columns={[
                                { key: 'name', header: 'Người dùng', render: (u) => <span className="font-medium">{u.name}<span className="block text-xs font-normal text-[#66728b]">{u.email}</span></span> },
                                { key: 'role', header: 'Vai trò', render: (u) => roleLabel(u.memberships?.[0]?.role?.name) },
                                { key: 'org', header: 'Tổ chức', render: (u) => u.memberships?.[0]?.organization?.name || '—' },
                                { key: 'isActive', header: 'Trạng thái', render: (u) => <SoftTag tone={u.isActive === false ? 'red' : 'green'}>{u.isActive === false ? 'Khoá' : 'Hoạt động'}</SoftTag> },
                            ] satisfies Column<UserRow>[]}
                        />
                    </DataCard>
                    <DataCard title="Tổ chức">
                        <DataTable
                            data={orgs}
                            emptyMessage="Chưa có tổ chức"
                            columns={[
                                { key: 'name', header: 'Tổ chức' },
                                { key: 'type', header: 'Loại' },
                                { key: 'email', header: 'Liên hệ', render: (o) => o.email || o.phone || '—' },
                                { key: 'actions', header: '', render: (o) => (
                                    <button type="button" className="text-sm text-red-600" onClick={async () => { await organizationApi.delete(o.id); load(); }}>Xóa</button>
                                ) },
                            ] satisfies Column<Organization>[]}
                        />
                    </DataCard>
                </div>
                <div className="space-y-4">
                    <DataCard title={selected?.name || 'Chọn người dùng'} subtitle={selected?.email}>
                        <div className="space-y-3 p-5 text-sm">
                            <p>{roleLabel(selected?.memberships?.[0]?.role?.name)} · {selected?.memberships?.[0]?.organization?.name || '—'}</p>
                            <Button
                                type="button"
                                variant="outline"
                                disabled={!selected}
                                onClick={async () => {
                                    if (!selected) return;
                                    try {
                                        await userApi.update(selected.id, { isActive: selected.isActive === false });
                                        showToast(selected.isActive === false ? 'Đã mở khoá' : 'Đã khoá', 'success');
                                        load();
                                    } catch (error) { showToast(getErrorMessage(error, 'Không đổi được trạng thái')); }
                                }}
                            >
                                {selected?.isActive === false ? 'Mở khoá' : 'Khoá'}
                            </Button>
                        </div>
                    </DataCard>
                    <DataCard title="Tạo tổ chức">
                        <form className="space-y-3 p-5 text-sm" onSubmit={saveOrg}>
                            <label className="admin-field">Tên<input value={orgForm.name} onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })} required /></label>
                            <label className="admin-field">Loại
                                <select value={orgForm.type} onChange={(e) => setOrgForm({ ...orgForm, type: e.target.value })}>
                                    <option value="delivery">Giao hàng</option>
                                    <option value="government">Cơ quan</option>
                                    <option value="university">Trường</option>
                                    <option value="platform">Nền tảng</option>
                                </select>
                            </label>
                            <label className="admin-field">Email<input value={orgForm.email} onChange={(e) => setOrgForm({ ...orgForm, email: e.target.value })} /></label>
                            <Button type="submit" className="w-full">Tạo</Button>
                        </form>
                    </DataCard>
                </div>
            </div>
        </div>
    );
}
