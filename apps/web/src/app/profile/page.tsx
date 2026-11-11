'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHead, StudioShell, adminNav, orgNav, regulatorNav, researchNav } from '@/components/studio/shell';
import { useAuthStore, getDashboardPath } from '@/stores/auth-store';
import { userApi } from '@/api';

export default function ProfilePage() {
    const router = useRouter();
    const { user, currentRole, setAuth, accessToken, logout } = useAuthStore();
    const [name, setName] = useState(user?.name || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [message, setMessage] = useState('');
    const nav = currentRole === 'admin' ? adminNav
        : currentRole === 'regulator' ? regulatorNav
            : currentRole === 'researcher' ? researchNav
                : orgNav;

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
        <StudioShell group="TÀI KHOẢN" role="Hồ sơ" items={nav}>
            <PageHead title="Hồ sơ tài khoản" />
            <form className="mx-6 mb-6 max-w-lg space-y-3 rounded-2xl bg-white p-5 text-sm" onSubmit={save}>
                <p className="text-xs text-[#7b8781]">{user?.email}</p>
                <label className="block">Họ tên<input className="mt-1 w-full rounded border px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} /></label>
                <label className="block">Điện thoại<input className="mt-1 w-full rounded border px-3 py-2" value={phone} onChange={(e) => setPhone(e.target.value)} /></label>
                <div className="flex gap-2 pt-2">
                    <button type="submit" className="rounded-lg bg-[#0e6e5c] px-4 py-2 text-white">Lưu</button>
                    <button type="button" className="rounded-lg border px-4 py-2" onClick={() => router.push(getDashboardPath(currentRole))}>Về trang chính</button>
                    <button type="button" className="rounded-lg border border-red-200 px-4 py-2 text-red-700" onClick={() => { logout(); router.push('/login'); }}>Đăng xuất</button>
                </div>
                {message && <p className="text-xs">{message}</p>}
            </form>
        </StudioShell>
    );
}
