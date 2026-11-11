'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    Truck,
    Package,
    MapPin,
    Route,
    BarChart3,
    Users,
    Building2,
    Settings,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    Scale,
    KeyRound,
    PackageSearch,
    Warehouse,
    Shield,
    Map,
    Navigation,
} from 'lucide-react';
import { useState } from 'react';

interface NavItem {
    label: string;
    href: string;
    icon: React.ReactNode;
}

interface NavGroup {
    label: string;
    icon: React.ReactNode;
    items: NavItem[];
}

type NavConfig = NavItem | NavGroup;

interface SidebarProps {
    title: string;
    navItems: NavConfig[];
}

function isNavGroup(item: NavConfig): item is NavGroup {
    return 'items' in item;
}

function NavGroupComponent({ group, collapsed, pathname }: { group: NavGroup; collapsed: boolean; pathname: string }) {
    const [expanded, setExpanded] = useState(true);
    const hasActiveChild = group.items.some(
        item => pathname === item.href || pathname.startsWith(item.href + '/')
    );

    if (collapsed) {
        return (
            <>
                {group.items.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                    return (
                        <li key={item.href}>
                            <Link
                                href={item.href}
                                className={cn(
                                    'flex items-center justify-center px-3 py-2.5 rounded-lg',
                                    'transition-all duration-150',
                                    isActive
                                        ? 'bg-[#1e5646] text-white'
                                        : 'text-[#d5e4dc] hover:bg-[#1e5646] hover:text-white'
                                )}
                                title={item.label}
                            >
                                {item.icon}
                            </Link>
                        </li>
                    );
                })}
            </>
        );
    }

    return (
        <li>
            <button
                onClick={() => setExpanded(!expanded)}
                className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm',
                    'transition-all duration-150',
                    'text-[#d5e4dc] hover:bg-[#1e5646] hover:text-white',
                    hasActiveChild && 'text-white'
                )}
            >
                {group.icon}
                <span className="flex-1 text-left font-semibold truncate">{group.label}</span>
                <ChevronDown
                    size={15}
                    className={cn(
                        'transition-transform duration-200',
                        expanded && 'rotate-180'
                    )}
                />
            </button>
            {expanded && (
                <ul className="mt-1 ml-3 space-y-0.5 border-l border-[#2d5c4c] pl-3">
                    {group.items.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className={cn(
                                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm',
                                        'transition-all duration-150',
                                        isActive
                                            ? 'bg-[#1e5646] font-medium text-white'
                                            : 'text-[#d5e4dc] hover:bg-[#1e5646] hover:text-white'
                                    )}
                                >
                                    {item.icon}
                                    <span className="truncate">{item.label}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            )}
        </li>
    );
}

export function Sidebar({ title, navItems }: SidebarProps) {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);

    return (
        <aside
            className={cn(
                'h-screen sticky top-0 flex flex-col',
                'bg-[#14352c] text-white',
                'border-r border-[#14352c]',
                'transition-all duration-300',
                collapsed ? 'w-16' : 'w-64'
            )}
        >
            {/* Header */}
            <div className="flex h-16 items-center justify-between px-4 border-b border-[#2d5c4c]">
                {!collapsed && (
                    <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#1f6b56] text-white">
                            <Navigation size={16} />
                        </span>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-bold leading-tight text-white">Logistics Đô thị</p>
                            <p className="text-[11px] font-medium text-[#9fb3aa]">ĐH GTVT · B2025-GHA-05</p>
                        </div>
                    </div>
                )}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className={cn(
                        'p-1.5 rounded-lg text-[#9fb3aa] hover:bg-[#1e5646] hover:text-white transition-colors',
                        collapsed && 'mx-auto'
                    )}
                >
                    {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 overflow-y-auto">
                <ul className="space-y-0.5 px-2">
                    {navItems.map((item, index) => {
                        if (isNavGroup(item)) {
                            return (
                                <NavGroupComponent
                                    key={item.label}
                                    group={item}
                                    collapsed={collapsed}
                                    pathname={pathname}
                                />
                            );
                        }

                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className={cn(
                                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium',
                                        'transition-all duration-150',
                                        isActive
                                            ? 'bg-[#1e5646] text-white'
                                            : 'text-[#d5e4dc] hover:bg-[#1e5646] hover:text-white',
                                        collapsed && 'justify-center'
                                    )}
                                    title={collapsed ? item.label : undefined}
                                >
                                    {item.icon}
                                    {!collapsed && <span className="truncate">{item.label}</span>}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* Footer */}
            {!collapsed && (
                <div className="p-4 border-t border-[#2d5c4c]">
                    <a href="/cong-khai" className="text-[11px] font-medium text-[#9fb3aa]">Website công khai ↗</a>
                </div>
            )}
        </aside>
    );
}

// Pre-defined nav items for each role
export const consumerNavItems: NavConfig[] = [
    { label: 'Bản đồ công khai', href: '/cong-khai', icon: <MapPin size={20} /> },
    { label: 'Đơn hàng', href: '/consumer/orders', icon: <Package size={20} /> },
    { label: 'Theo dõi vận đơn', href: '/consumer/tracking', icon: <PackageSearch size={20} /> },
    { label: 'Tra cứu', href: '/consumer/search', icon: <Building2 size={20} /> },
];

export const deliveryNavItems: NavConfig[] = [
    // Quick access
    { label: 'Tổng quan', href: '/doanh-nghiep', icon: <LayoutDashboard size={20} /> },

    // Nhóm 1: Quản lý Đội
    {
        label: 'Quản lý Đội',
        icon: <Users size={20} />,
        items: [
            { label: 'Shipper', href: '/delivery/shippers', icon: <Users size={18} /> },
            { label: 'Đội xe', href: '/delivery/fleet', icon: <Truck size={18} /> },
        ],
    },

    // Nhóm 2: Vận hành
    {
        label: 'Vận hành',
        icon: <Package size={20} />,
        items: [
            { label: 'Đơn hàng', href: '/delivery/orders', icon: <Package size={18} /> },
            { label: 'Chuyến giao (Route)', href: '/delivery/routes', icon: <Route size={18} /> },
            { label: 'Giám sát', href: '/delivery/tracking', icon: <PackageSearch size={18} /> },
        ],
    },
];

export const shipperNavItems: NavConfig[] = [
    { label: 'Bản đồ', href: '/thanh-vien/ban-do', icon: <Route size={20} /> },
    { label: 'Lịch sử', href: '/shipper/history', icon: <BarChart3 size={20} /> },
];

export const regulatorNavItems: NavConfig[] = [
    // Quick access
    { label: 'Giám sát', href: '/co-quan', icon: <LayoutDashboard size={20} /> },

    // Nhóm 1: Vùng & Quy định
    {
        label: 'Vùng & Quy định',
        icon: <Map size={20} />,
        items: [
            { label: 'Vùng & Zone', href: '/co-quan/zone', icon: <MapPin size={18} /> },
            { label: 'Quản lý cấm đường', href: '/co-quan/zone', icon: <Scale size={18} /> },
        ],
    },

    // Nhóm 2: Giám sát Carriers
    {
        label: 'Giám sát',
        icon: <Shield size={20} />,
        items: [
            { label: 'Carriers', href: '/regulator/carriers', icon: <Truck size={18} /> },
        ],
    },

    // Nhóm 3: Báo cáo
    {
        label: 'Báo cáo',
        icon: <BarChart3 size={20} />,
        items: [
            { label: 'Báo cáo tổng hợp', href: '/regulator/reports', icon: <BarChart3 size={18} /> },
        ],
    },
];

export const logisticsNavItems: NavConfig[] = [
    // Quick access - Dashboard luôn ở trên cùng
    { label: 'Dữ liệu nền', href: '/he-thong/du-lieu', icon: <LayoutDashboard size={20} /> },

    // Nhóm 1: Carrier & hệ thống
    {
        label: 'Carrier & hệ thống',
        icon: <Settings size={20} />,
        items: [
            { label: 'Carriers', href: '/logistics/carriers', icon: <Truck size={18} /> },
            { label: 'Người dùng & Vai trò', href: '/logistics/users', icon: <Users size={18} /> },
            { label: 'API Keys (B2B)', href: '/logistics/integrations', icon: <KeyRound size={18} /> },
            { label: 'Hệ số phát thải CO₂', href: '/logistics/emissions', icon: <Scale size={18} /> },
            { label: 'Hồ sơ khảo sát & kế hoạch', href: '/logistics/records', icon: <Package size={18} /> },
            { label: 'Cài đặt', href: '/logistics/settings', icon: <Settings size={18} /> },
        ],
    },

    // Nhóm 2: Hạ tầng
    {
        label: 'Hạ tầng',
        icon: <Warehouse size={20} />,
        items: [
            { label: 'Cơ sở Logistics', href: '/logistics/facilities', icon: <Warehouse size={18} /> },
        ],
    },

    // Nhóm 3: Quy định toàn thành phố
    {
        label: 'Quy định toàn thành phố',
        icon: <Shield size={20} />,
        items: [
            { label: 'Vùng & Zone', href: '/co-quan/zone', icon: <Map size={18} /> },
            { label: 'Quản lý cấm đường', href: '/co-quan/zone', icon: <Scale size={18} /> },
        ],
    },
];
