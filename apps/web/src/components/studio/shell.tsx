'use client';

import { Be_Vietnam_Pro } from 'next/font/google';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import {
    Bell,
    Building2,
    ChevronDown,
    Database,
    ClipboardList,
    FileText,
    FlaskConical,
    Home,
    LayoutDashboard,
    LogOut,
    Menu,
    MoreHorizontal,
    Plug,
    Settings,
    Target,
    User,
    Users,
    Warehouse,
    Truck,
    MapPin,
    Package,
    AlertTriangle,
    ClipboardCheck,
    Navigation,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import './admin-shell.css';

const beVietnam = Be_Vietnam_Pro({
    subsets: ['latin', 'vietnamese'],
    weight: ['400', '500', '600', '700', '800'],
});

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

export type StudioNavItem = { href: string; label: string; icon?: ReactNode };
export type StudioNavGroup = { title: string; items: StudioNavItem[] };

export function StudioShell({
    group,
    items,
    groups,
    role,
    children,
}: {
    group: string;
    items?: StudioNavItem[];
    groups?: StudioNavGroup[];
    role: string;
    children: ReactNode;
}) {
    const path = usePathname();
    const router = useRouter();
    const { user, logout, isAuthenticated } = useAuthStore();
    const membershipRole = user?.memberships?.[0]?.role?.name;
    const displayRole = roleLabel(membershipRole, role);
    const initials = (user?.name || 'AD').slice(0, 2).toUpperCase();
    const orgName = user?.memberships?.[0]?.organization?.name || 'Không gian quản trị';
    const orgInitials = orgName.slice(0, 2).toUpperCase();
    const [collapsed, setCollapsed] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const sidebarItems = items === memberNav && membershipRole === 'shipper' ? shipperNav : items;
    const navGroups = groups ?? [{ title: group, items: sidebarItems ?? [] }];
    const flatItems = navGroups.flatMap((g) => g.items);
    const current = useMemo(
        () =>
            [...flatItems]
                .sort((a, b) => b.href.length - a.href.length)
                .find((item) => path === item.href || path.startsWith(`${item.href}/`)),
        [flatItems, path],
    );

    useEffect(() => {
        const onDoc = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
        };
        document.addEventListener('mousedown', onDoc);
        return () => document.removeEventListener('mousedown', onDoc);
    }, []);

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    return (
        <div className={`admin-shell${collapsed ? ' is-collapsed' : ''} ${beVietnam.className}`}>
            <aside className="admin-sider">
                <Link href="/logistics/dashboard" className="admin-brand" aria-label="Nội Thành Logistics">
                    <img src="/landing/brand-mark.svg" alt="" width={32} height={32} />
                    {!collapsed && (
                        <div className="brand-text">
                            <span>NỘI THÀNH</span>
                            <span>LOGISTICS PLATFORM</span>
                        </div>
                    )}
                </Link>
                {!collapsed && (
                    <div className="workspace-chip">
                        <span className="ws-avatar">{orgInitials}</span>
                        <div>
                            <span>{orgName}</span>
                            <span>Không gian quản trị</span>
                        </div>
                        <ChevronDown size={12} color="rgba(255,255,255,0.42)" />
                    </div>
                )}
                <nav className="admin-nav">
                    {navGroups.map((g) => (
                        <div key={g.title}>
                            {!collapsed && <p className="admin-nav-group">{g.title}</p>}
                            {g.items.map((item) => {
                                const active = current?.href === item.href;
                                return (
                                    <Link key={item.href} href={item.href} className={active ? 'active' : ''} title={item.label}>
                                        {item.icon}
                                        {!collapsed && <span className="min-w-0 flex-1 truncate">{item.label}</span>}
                                    </Link>
                                );
                            })}
                        </div>
                    ))}
                </nav>
                <div className="sider-bottom">
                    {isAuthenticated && user ? (
                        <button type="button" className="sider-user" onClick={() => router.push('/profile')}>
                            <span className="su-avatar">{initials}</span>
                            {!collapsed && (
                                <>
                                    <div className="su-meta">
                                        <span>{user.name}</span>
                                        <span>{displayRole}</span>
                                    </div>
                                    <MoreHorizontal size={14} color="rgba(255,255,255,0.45)" />
                                </>
                            )}
                        </button>
                    ) : (
                        <Link href="/login" className="sider-user">
                            <span className="su-avatar">IN</span>
                            {!collapsed && <div className="su-meta"><span>Đăng nhập</span></div>}
                        </Link>
                    )}
                </div>
            </aside>
            <div className="admin-main">
                <header className="admin-header">
                    <div className="flex items-center gap-3.5">
                        <button type="button" className="icon-btn" onClick={() => setCollapsed((v) => !v)} aria-label="Thu gọn menu">
                            <Menu size={18} />
                        </button>
                        <div className="header-title">
                            <span>{group}</span>
                            <span>{current?.label || 'Tổng quan'}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <input className="global-search" placeholder="Tìm kiếm nhanh..." />
                        <button type="button" className="icon-btn relative" aria-label="Thông báo">
                            <Bell size={16} />
                            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#2f6bff]" />
                        </button>
                        <div className="relative" ref={menuRef}>
                            <button type="button" className="account-button" onClick={() => setMenuOpen((v) => !v)}>
                                <span className="acc-avatar">{initials}</span>
                                <span>{user?.name?.split(' ').pop() || 'Admin'}</span>
                                <ChevronDown size={14} />
                            </button>
                            {menuOpen && (
                                <div className="header-menu">
                                    <button type="button" className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-[#f4f6fb]" onClick={() => { setMenuOpen(false); router.push('/profile'); }}>
                                        <User size={16} /> Hồ sơ tài khoản
                                    </button>
                                    {isAuthenticated && (
                                        <button type="button" className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50" onClick={handleLogout}>
                                            <LogOut size={16} /> Đăng xuất
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </header>
                <div className="admin-content">{children}</div>
            </div>
        </div>
    );
}

export function PageHead({
    title,
    extra,
    description,
    eyebrow,
    crumb,
}: {
    title: string;
    extra?: ReactNode;
    description?: string;
    eyebrow?: string | null;
    crumb?: string;
}) {
    return (
        <div className="page-heading flex items-end justify-between gap-6">
            <div>
                <p className="crumbs">Nội Thành / {crumb || title}</p>
                {eyebrow ? <p className="page-eyebrow">{eyebrow}</p> : null}
                <h1>{title}</h1>
                {description && <p>{description}</p>}
            </div>
            {extra}
        </div>
    );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
    return <section className={`rounded-2xl bg-white shadow-sm ${className}`}>{children}</section>;
}

const icon = (node: ReactNode) => node;

export const orgNav: StudioNavItem[] = [
    { href: '/doanh-nghiep', label: 'Tổng quan', icon: icon(<Home size={16} />) },
    { href: '/doanh-nghiep/doi-xe', label: 'Đội xe & kho', icon: icon(<Warehouse size={16} />) },
    { href: '/doanh-nghiep/dieu-phoi', label: 'Điều phối đơn', icon: icon(<Truck size={16} />) },
    { href: '/doanh-nghiep/tim-duong', label: 'Tìm đường', icon: icon(<Navigation size={16} />) },
    { href: '/doanh-nghiep/toi-uu', label: 'Tối ưu tuyến', icon: icon(<Target size={16} />) },
    { href: '/doanh-nghiep/bao-cao', label: 'Báo cáo giao thông', icon: icon(<ClipboardList size={16} />) },
];

export const regulatorNav: StudioNavItem[] = [
    { href: '/co-quan', label: 'Tổng quan', icon: icon(<LayoutDashboard size={16} />) },
    { href: '/co-quan/bao-cao', label: 'Giám sát báo cáo', icon: icon(<ClipboardList size={16} />) },
    { href: '/co-quan/zone', label: 'Zone & quy định', icon: icon(<Target size={16} />) },
    { href: '/co-quan/nguoi-dung', label: 'Người dùng báo cáo', icon: icon(<Users size={16} />) },
];

export const memberNav: StudioNavItem[] = [
    { href: '/thanh-vien/ban-do', label: 'Bản đồ giao thông', icon: icon(<MapPin size={16} />) },
    { href: '/thanh-vien/tim-duong', label: 'Tìm đường', icon: icon(<Navigation size={16} />) },
    { href: '/thanh-vien/theo-doi', label: 'Theo dõi đơn hàng', icon: icon(<Package size={16} />) },
    { href: '/thanh-vien/bao-cao', label: 'Báo cáo giao thông', icon: icon(<AlertTriangle size={16} />) },
];

export const shipperNav: StudioNavItem[] = [
    { href: '/thanh-vien/ban-do', label: 'Bản đồ giao thông', icon: icon(<MapPin size={16} />) },
    { href: '/thanh-vien/tim-duong', label: 'Tìm đường', icon: icon(<Navigation size={16} />) },
    { href: '/thanh-vien/theo-doi', label: 'Theo dõi đơn hàng', icon: icon(<Package size={16} />) },
    { href: '/thanh-vien/don-hang', label: 'Đơn đang giao', icon: icon(<ClipboardCheck size={16} />) },
    { href: '/thanh-vien/bao-cao', label: 'Báo cáo giao thông', icon: icon(<AlertTriangle size={16} />) },
];

export const researchNav: StudioNavItem[] = [
    { href: '/nghien-cuu', label: 'Khảo sát & duyệt phiếu', icon: icon(<FileText size={16} />) },
    { href: '/nghien-cuu/xuat', label: 'Dữ liệu & xuất', icon: icon(<Database size={16} />) },
    { href: '/nghien-cuu/bao-cao', label: 'Báo cáo giao thông', icon: icon(<ClipboardList size={16} />) },
];

export const adminNavGroups: StudioNavGroup[] = [
    {
        title: 'TRUNG TÂM ĐIỀU HÀNH',
        items: [{ href: '/logistics/dashboard', label: 'Tổng quan', icon: icon(<Home size={16} />) }],
    },
    {
        title: 'ĐỐI TÁC & VẬN HÀNH',
        items: [
            { href: '/logistics/carriers', label: 'Carrier', icon: icon(<Building2 size={16} />) },
            { href: '/he-thong/nguoi-dung', label: 'Người dùng & tổ chức', icon: icon(<Users size={16} />) },
            { href: '/logistics/integrations', label: 'API tích hợp (B2B)', icon: icon(<Plug size={16} />) },
            { href: '/logistics/records', label: 'Hồ sơ vận hành', icon: icon(<FileText size={16} />) },
            { href: '/logistics/settings', label: 'Cài đặt hệ thống', icon: icon(<Settings size={16} />) },
        ],
    },
    {
        title: 'HẠ TẦNG & QUY ĐỊNH',
        items: [
            { href: '/logistics/facilities', label: 'Cơ sở logistics', icon: icon(<Warehouse size={16} />) },
            { href: '/he-thong/tim-duong', label: 'Tìm đường', icon: icon(<Navigation size={16} />) },
            { href: '/logistics/zones', label: 'Vùng & quy định', icon: icon(<Target size={16} />) },
            { href: '/logistics/simulation', label: 'Mô phỏng chính sách', icon: icon(<FlaskConical size={16} />) },
            { href: '/he-thong/du-lieu', label: 'Dữ liệu & hệ thống', icon: icon(<Database size={16} />) },
        ],
    },
    {
        title: 'TÀI KHOẢN',
        items: [{ href: '/profile', label: 'Hồ sơ của tôi', icon: icon(<User size={16} />) }],
    },
];

export const adminNav: StudioNavItem[] = adminNavGroups.flatMap((g) => g.items);
