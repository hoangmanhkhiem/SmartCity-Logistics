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
} from 'lucide-react';
import { useState } from 'react';

interface NavItem {
    label: string;
    href: string;
    icon: React.ReactNode;
}

interface SidebarProps {
    title: string;
    navItems: NavItem[];
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
                    {navItems.map((item) => {
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
                                            : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                    )}
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
export const consumerNavItems: NavItem[] = [
    { label: 'Bản đồ', href: '/consumer', icon: <MapPin size={20} /> },
    { label: 'Đơn hàng', href: '/consumer/orders', icon: <Package size={20} /> },
    { label: 'Tra cứu', href: '/consumer/search', icon: <Building2 size={20} /> },
];

export const deliveryNavItems: NavItem[] = [
    { label: 'Dashboard', href: '/delivery/dashboard', icon: <LayoutDashboard size={20} /> },
    { label: 'Đội xe', href: '/delivery/fleet', icon: <Truck size={20} /> },
    { label: 'Đơn hàng', href: '/delivery/orders', icon: <Package size={20} /> },
    { label: 'Tracking', href: '/delivery/tracking', icon: <MapPin size={20} /> },
    { label: 'Tuyến đường', href: '/delivery/routes', icon: <Route size={20} /> },
    { label: 'Tài xế', href: '/delivery/drivers', icon: <Users size={20} /> },
];

export const regulatorNavItems: NavItem[] = [
    { label: 'Dashboard', href: '/regulator/dashboard', icon: <LayoutDashboard size={20} /> },
    { label: 'Vùng & Zone', href: '/regulator/zones', icon: <MapPin size={20} /> },
    { label: 'Báo cáo', href: '/regulator/reports', icon: <BarChart3 size={20} /> },
    { label: 'Carriers', href: '/regulator/carriers', icon: <Truck size={20} /> },
    { label: 'Hạn chế', href: '/regulator/restrictions', icon: <Settings size={20} /> },
];

export const logisticsNavItems: NavItem[] = [
    { label: 'Dashboard', href: '/logistics/dashboard', icon: <LayoutDashboard size={20} /> },
    { label: 'Cơ sở', href: '/logistics/facilities', icon: <Building2 size={20} /> },
    { label: 'Đội xe', href: '/logistics/vehicles', icon: <Truck size={20} /> },
    { label: 'Tuyến', href: '/logistics/routes', icon: <Route size={20} /> },
    { label: 'Nhân viên', href: '/logistics/users', icon: <Users size={20} /> },
    { label: 'Cài đặt', href: '/logistics/settings', icon: <Settings size={20} /> },
];
