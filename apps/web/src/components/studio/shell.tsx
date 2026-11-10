'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

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
                        const active = path === item.href;
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
                    <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1e5646] text-[11px] font-bold">TV</span>
                        <div>
                            <p className="font-semibold">[Tên người dùng]</p>
                            <p className="text-[#9fb3aa]">{role}</p>
                        </div>
                    </div>
                </div>
            </aside>
            <div className="min-w-0 flex-1">{children}</div>
        </div>
    );
}

export function PageHead({ title, extra }: { title: string; extra?: ReactNode }) {
    return (
        <header className="flex items-center justify-between gap-3 bg-[#e7eee9] px-6 py-4">
            <h1 className="text-[22px] font-semibold tracking-tight">{title}</h1>
            <div className="flex items-center gap-2">{extra}<span className="rounded-full bg-[#f3e6cf] px-2.5 py-1 text-[11px] text-[#8a5a12]">Số liệu minh hoạ</span></div>
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
