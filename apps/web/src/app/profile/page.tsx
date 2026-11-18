'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHead, StudioShell, adminNavGroups, memberNav, orgNav, regulatorNav, researchNav } from '@/components/studio/shell';
import { DataCard, SoftTag } from '@/components/studio/page-ui';
import { useAuthStore, getDashboardPath } from '@/stores/auth-store';
import { Button } from '@/components/ui';
import { userApi } from '@/api';
import { Lock } from 'lucide-react';

export default function ProfilePage() {
    const router = useRouter();
    const { user, currentRole, setAuth, accessToken, logout } = useAuthStore();
    const [name, setName] = useState(user?.name || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [message, setMessage] = useState('');
    const nav = currentRole === 'regulator' ? regulatorNav
        : currentRole === 'researcher' ? researchNav
            : currentRole === 'shipper' ? memberNav
            : orgNav;
    const initials = (user?.name || 'AD').slice(0, 2).toUpperCase();

    const save = async (e: FormEvent) => {
        e.preventDefault();
        if (!user) return;
        try {
            const res = await userApi.update(user.id, { name, phone });
            if (accessToken) setAuth({ ...user, ...res.data }, accessToken);
            setMessage('Đã lưu hồ sơ.');
        } catch {
            setMessage('Không lưu được. Thử lại sau.');
        }
    };

    return (
        <StudioShell
            group={currentRole === 'admin' ? 'QUẢN TRỊ HỆ THỐNG' : 'TÀI KHOẢN'}
            role="Hồ sơ"
            items={currentRole === 'admin' ? undefined : nav}
            groups={currentRole === 'admin' ? adminNavGroups : undefined}
        >
            <div className="space-y-6">
                <PageHead
                    title="Hồ sơ tài khoản"
                    description="Quản lý thông tin cá nhân và bảo mật tài khoản."
                />
                <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
                    <DataCard>
                        <div className="flex items-center gap-4 p-6">
                            <div className="grid h-[72px] w-[72px] place-items-center rounded-full bg-[#0b1b3a] text-lg font-extrabold text-white">{initials}</div>
                            <div className="flex-1">
                                <h2 className="text-lg font-bold text-[#0b1b3a]">{user?.name || 'Tài khoản'}</h2>
                                <p className="text-sm text-[#66728b]">{user?.email} · Quản trị hệ thống</p>
                            </div>
                            <SoftTag tone="green">Đã xác minh</SoftTag>
                        </div>
                        <form className="grid gap-4 border-t border-[#e4e8f1] p-6 sm:grid-cols-2" onSubmit={save}>
                            <label className="admin-field">Họ và tên<input value={name} onChange={(e) => setName(e.target.value)} /></label>
                            <label className="admin-field">Số điện thoại<input value={phone} onChange={(e) => setPhone(e.target.value)} /></label>
                            <label className="admin-field">Email<input value={user?.email || ''} disabled /></label>
                            <label className="admin-field">Tổ chức<input value={user?.memberships?.[0]?.organization?.name || 'Nội Thành Logistics'} disabled /></label>
                            <div className="sm:col-span-2">
                                <Button type="submit">Lưu thay đổi</Button>
                                {message && <span className="ml-3 text-sm text-[#66728b]">{message}</span>}
                            </div>
                        </form>
                    </DataCard>
                    <DataCard title="Bảo mật tài khoản">
                        <div className="flex items-start justify-between gap-3 p-6">
                            <div className="flex gap-3">
                                <div className="grid h-10 w-10 place-items-center rounded-full bg-[#eaf0ff] text-[#2f6bff]">
                                    <Lock size={18} />
                                </div>
                                <div>
                                    <p className="font-semibold text-[#0b1b3a]">Mật khẩu</p>
                                    <p className="text-sm text-[#66728b]">Cập nhật định kỳ để bảo vệ tài khoản</p>
                                </div>
                            </div>
                            <Button type="button" variant="outline" onClick={() => { logout(); router.push('/login'); }}>Thay đổi</Button>
                        </div>
                        <div className="flex gap-2 border-t border-[#e4e8f1] p-6">
                            <Button type="button" variant="outline" onClick={() => router.push(getDashboardPath(currentRole))}>Về trang chính</Button>
                            <Button type="button" variant="danger" onClick={() => { logout(); router.push('/login'); }}>Đăng xuất</Button>
                        </div>
                    </DataCard>
                </div>
            </div>
        </StudioShell>
    );
}
