'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useAuthStore } from '@/stores/auth-store';

const ROLE_LABEL: Record<string, string> = {
    platform_admin: 'Quản trị nền tảng',
    sys_admin: 'Quản trị hệ thống',
    regulator: 'Cơ quan quản lý',
    org_admin: 'Quản trị DN',
    org_staff: 'Nhân viên DN',
    carrier_ops: 'Vận hành',
    researcher: 'Nghiên cứu',
    member: 'Thành viên',
    shipper: 'Shipper',
    consumer: 'Khách hàng',
};

export function roleLabel(raw?: string, fallback = 'Thành viên') {
    return (raw && ROLE_LABEL[raw]) || fallback;
}

export function StudioShell({
    group,
    items,
    role,
    children,
}: {
    group: string;
    items: Array<{ href: string; label: string }>;
    role: string;
    children: ReactNode;
}) {
    const path = usePathname();
    const router = useRouter();
    const { user, logout, isAuthenticated } = useAuthStore();
    const membershipRole = user?.memberships?.[0]?.role?.name;
    const displayRole = roleLabel(membershipRole, role);
    const initials = (user?.name || 'TV').slice(0, 2).toUpperCase();

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    return (
        <div className="flex min-h-screen bg-[#e7eee9] text-[#14211c]">
            <aside className="flex w-[232px] shrink-0 flex-col bg-[#14352c] text-white">
                <div className="flex items-center gap-2 px-4 py-4">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1f6b56] text-sm font-bold">↗</span>
                    <div>
                        <p className="text-sm font-bold leading-tight">Logistics Đô thị</p>
                        <p className="text-[10px] text-[#9fb3aa]">ĐH GTVT · B2025-GHA-05</p>
                    </div>
                </div>
                <p className="px-4 pb-2 text-[10px] font-bold tracking-[0.14em] text-[#9fb3aa]">{group}</p>
                <nav className="flex-1 space-y-0.5 px-2">
                    {items.map((item) => {
                        const active = path === item.href || path.startsWith(`${item.href}/`);
                        return (
                            <Link key={item.href} href={item.href} className={`block rounded-lg px-3 py-2 text-sm ${active ? 'bg-[#1e5646] font-semibold' : 'text-[#d5e4dc]'}`}>
                                {item.label}
                            </Link>
                        );
                    })}
                    <Link href="/mobile/nhiem-vu" className="mt-4 block rounded-lg border border-[#2d5c4c] px-3 py-2 text-[13px] text-[#e7f3ee]">
                        Nhiệm vụ khảo sát
                        <span className="mt-0.5 block text-[11px] font-normal text-[#9fb3aa]">Hiện khi nhóm nghiên cứu giao cho tài khoản này</span>
                    </Link>
                </nav>
                <div className="space-y-3 border-t border-[#2d5c4c] p-3 text-xs">
                    <Link href="/cong-khai" className="text-[#9fb3aa]">Website công khai ↗</Link>
                    {isAuthenticated && user ? (
                        <>
                            <Link href="/profile" className="flex items-center gap-2">
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1e5646] text-[11px] font-bold">{initials}</span>
                                <div className="min-w-0">
                                    <p className="truncate font-semibold">{user.name}</p>
                                    <p className="truncate text-[#9fb3aa]">{displayRole}</p>
                                </div>
                            </Link>
                            <button type="button" onClick={handleLogout} className="w-full rounded-lg bg-[#0e6e5c] py-2 font-semibold text-white">
                                Đăng xuất
                            </button>
                        </>
                    ) : (
                        <Link href="/login" className="block rounded-lg bg-[#0e6e5c] py-2 text-center font-semibold text-white">Đăng nhập</Link>
                    )}
                </div>
            </aside>
            <div className="min-w-0 flex-1">{children}</div>
        </div>
    );
}

export function PageHead({ title, extra }: { title: string; extra?: ReactNode }) {
    const router = useRouter();
    const { user, logout, isAuthenticated } = useAuthStore();
    return (
        <header className="flex items-center justify-between gap-3 bg-[#e7eee9] px-6 py-4">
            <h1 className="text-[22px] font-semibold tracking-tight">{title}</h1>
            <div className="flex flex-wrap items-center justify-end gap-2">
                {extra}
                {isAuthenticated && user && (
                    <button
                        type="button"
                        onClick={() => { logout(); router.push('/login'); }}
                        className="rounded-lg border border-[#d5e0da] bg-white px-3 py-1.5 text-sm font-semibold text-[#14211c]"
                    >
                        Đăng xuất
                    </button>
                )}
            </div>
        </header>
    );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
    return <section className={`rounded-2xl bg-white shadow-sm ${className}`}>{children}</section>;
}

export const orgNav = [
    { href: '/doanh-nghiep', label: 'Tổng quan' },
    { href: '/doanh-nghiep/doi-xe', label: 'Đội xe & kho' },
    { href: '/doanh-nghiep/toi-uu', label: 'Tối ưu tuyến' },
    { href: '/thanh-vien/ban-do', label: 'Bản đồ chung' },
];

export const regulatorNav = [
    { href: '/co-quan', label: 'Giám sát' },
    { href: '/co-quan/zone', label: 'Zone & quy định' },
    { href: '/co-quan/mo-phong', label: 'Mô phỏng chính sách' },
];

export const researchNav = [
    { href: '/nghien-cuu', label: 'Khảo sát & duyệt phiếu' },
    { href: '/nghien-cuu/xuat', label: 'Dữ liệu & xuất' },
];

export const adminNav = [
    { href: '/he-thong/nguoi-dung', label: 'Người dùng & tổ chức' },
    { href: '/he-thong/du-lieu', label: 'Dữ liệu nền & hệ thống' },
];
