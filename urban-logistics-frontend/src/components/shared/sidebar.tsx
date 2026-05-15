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
    Table2,
    GitBranch,
    Scale,
    KeyRound,
    PackageSearch,
    LayoutGrid,
    Warehouse,
    Shield,
    FileText,
    MessageSquare,
    Star,
    AlertCircle,
    Map,
    Send,
    Activity,
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
                                    'transition-all duration-200',
                                    isActive
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
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
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg',
                    'transition-all duration-200',
                    'text-gray-300 hover:bg-gray-800',
                    hasActiveChild && 'text-blue-400'
                )}
            >
                {group.icon}
                <span className="flex-1 text-left font-medium truncate">{group.label}</span>
                <ChevronDown
                    size={16}
                    className={cn(
                        'transition-transform duration-200',
                        expanded && 'rotate-180'
                    )}
                />
            </button>
            {expanded && (
                <ul className="mt-1 ml-4 space-y-1">
                    {group.items.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className={cn(
                                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm',
                                        'transition-all duration-200',
                                        isActive
                                            ? 'bg-blue-600 text-white'
                                            : 'text-gray-400 hover:bg-gray-800 hover:text-white'
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
                'bg-gray-900 text-white',
                'transition-all duration-300',
                collapsed ? 'w-16' : 'w-64'
            )}
        >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
                {!collapsed && (
                    <h1 className="text-lg font-bold text-blue-400 truncate">{title}</h1>
                )}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors"
                >
                    {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 overflow-y-auto">
                <ul className="space-y-1 px-2">
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
                                        'flex items-center gap-3 px-3 py-2.5 rounded-lg',
                                        'transition-all duration-200',
                                        isActive
                                            ? 'bg-blue-600 text-white'
                                            : 'text-gray-400 hover:bg-gray-800 hover:text-white',
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
                <div className="p-4 border-t border-gray-700">
                    <p className="text-xs text-gray-500">Urban Logistics v1.0</p>
                </div>
            )}
        </aside>
    );
}

// Pre-defined nav items for each role
export const consumerNavItems: NavConfig[] = [
    { label: 'Bản đồ', href: '/consumer', icon: <MapPin size={20} /> },
    { label: 'Đơn hàng', href: '/consumer/orders', icon: <Package size={20} /> },
    { label: 'Theo dõi vận đơn', href: '/consumer/tracking', icon: <PackageSearch size={20} /> },
    { label: 'Tra cứu', href: '/consumer/search', icon: <Building2 size={20} /> },
];

export const deliveryNavItems: NavConfig[] = [
    // Quick access
    { label: 'Dashboard', href: '/delivery/dashboard', icon: <LayoutDashboard size={20} /> },

    // Nhóm 1: Quản lý Đội
    {
        label: 'Quản lý Đội',
        icon: <Users size={20} />,
        items: [
            { label: 'Tài xế', href: '/delivery/drivers', icon: <Users size={18} /> },
            { label: 'Đội xe', href: '/delivery/fleet', icon: <Truck size={18} /> },
        ],
    },

    // Nhóm 2: Vận hành
    {
        label: 'Vận hành',
        icon: <Package size={20} />,
        items: [
            { label: 'Đơn hàng', href: '/delivery/orders', icon: <Package size={18} /> },
            { label: 'Tuyến đường', href: '/delivery/routes', icon: <Route size={18} /> },
            { label: 'Theo dõi', href: '/delivery/tracking', icon: <PackageSearch size={18} /> },
        ],
    },
];

export const regulatorNavItems: NavConfig[] = [
    // Quick access
    { label: 'Dashboard', href: '/regulator/dashboard', icon: <LayoutDashboard size={20} /> },

    // Nhóm 1: Vùng & Quy định
    {
        label: 'Vùng & Quy định',
        icon: <Map size={20} />,
        items: [
            { label: 'Vùng & Zone', href: '/regulator/zones', icon: <MapPin size={18} /> },
            { label: 'Quản lý cấm đường', href: '/regulator/restrictions', icon: <Scale size={18} /> },
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

    // Nhóm 3: Dữ liệu & Báo cáo
    {
        label: 'Dữ liệu & Báo cáo',
        icon: <BarChart3 size={20} />,
        items: [
            { label: 'Báo cáo', href: '/regulator/reports', icon: <BarChart3 size={18} /> },
            { label: 'Dữ liệu nghiên cứu', href: '/regulator/research', icon: <Table2 size={18} /> },
        ],
    },
];

export const logisticsNavItems: NavConfig[] = [
    // Quick access - Dashboard luôn ở trên cùng
    { label: 'Dashboard', href: '/logistics/dashboard', icon: <LayoutDashboard size={20} /> },

    // Nhóm 1: Quản lý hệ thống
    {
        label: 'Quản lý hệ thống',
        icon: <Settings size={20} />,
        items: [
            { label: 'Người dùng & Vai trò', href: '/logistics/users', icon: <Users size={18} /> },
            { label: 'API Keys', href: '/logistics/api-keys', icon: <KeyRound size={18} /> },
            { label: 'Tích hợp', href: '/logistics/integrations', icon: <GitBranch size={18} /> },
            { label: 'Cài đặt', href: '/logistics/settings', icon: <Settings size={18} /> },
        ],
    },

    // Nhóm 2: Nội dung & Cộng đồng
    {
        label: 'Nội dung & Cộng đồng',
        icon: <MessageSquare size={20} />,
        items: [
            { label: 'Quản lý Trạm', href: '/logistics/stations', icon: <Building2 size={18} /> },
            { label: 'Bài viết', href: '/logistics/articles', icon: <FileText size={18} /> },
            { label: 'Đánh giá', href: '/logistics/reviews', icon: <Star size={18} /> },
            { label: 'Báo lỗi', href: '/logistics/reports', icon: <AlertCircle size={18} /> },
        ],
    },

    // Nhóm 3: Vận hành Logistics
    {
        label: 'Vận hành Logistics',
        icon: <Truck size={20} />,
        items: [
            { label: 'Cơ sở Logistics', href: '/logistics/facilities', icon: <Warehouse size={18} /> },
            { label: 'Gợi ý Cơ sở', href: '/logistics/facility-suggest', icon: <MapPin size={18} /> },
            { label: 'Đội xe', href: '/logistics/vehicles', icon: <Truck size={18} /> },
            { label: 'Tuyến đường', href: '/logistics/routes', icon: <Route size={18} /> },
            { label: 'Đơn hàng', href: '/logistics/orders', icon: <Package size={18} /> },
            { label: 'Báo giá', href: '/logistics/quotes', icon: <BarChart3 size={18} /> },
            { label: 'Tối ưu tuyến', href: '/logistics/optimize', icon: <GitBranch size={18} /> },
            { label: 'Điều phối', href: '/logistics/dispatch', icon: <Send size={18} /> },
            { label: 'Giám sát Realtime', href: '/logistics/monitor', icon: <Activity size={18} /> },
        ],
    },

    // Nhóm 4: Quy định & Báo cáo
    {
        label: 'Quy định & Báo cáo',
        icon: <Shield size={20} />,
        items: [
            { label: 'Vùng & Zone', href: '/logistics/zones', icon: <Map size={18} /> },
            { label: 'Quản lý cấm đường', href: '/logistics/restrictions', icon: <Scale size={18} /> },
            { label: 'Báo cáo & KPI', href: '/logistics/reports-kpi', icon: <BarChart3 size={18} /> },
            { label: 'Dữ liệu nghiên cứu', href: '/logistics/research', icon: <Table2 size={18} /> },
        ],
    },
];
