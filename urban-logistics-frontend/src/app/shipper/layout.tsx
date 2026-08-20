'use client';

import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Route as RouteIcon, History, LogOut, Truck } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { shipperApi } from '@/lib/api';

const tabs = [
    { href: '/shipper/today', label: 'Route hôm nay', icon: RouteIcon },
    { href: '/shipper/history', label: 'Lịch sử', icon: History },
];

export default function ShipperLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout } = useAuthStore();
    const [vehiclePlate, setVehiclePlate] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;
        shipperApi
            .listByCarrier()
            .then((res) => {
                const me = (res.data as Array<{ userId: number; currentVehicle?: { plate?: string } | null }>).find(
                    (s) => s.userId === user.id,
                );
                setVehiclePlate(me?.currentVehicle?.plate ?? null);
            })
            .catch(() => setVehiclePlate(null));
    }, [user]);

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    return (
        <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
            {/* Top bar */}
            <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-slate-200 bg-white/80 backdrop-blur-sm px-4 dark:border-slate-800 dark:bg-slate-950/80">
                <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-cyan-500 text-white text-xs font-bold">
                        {user?.name?.charAt(0).toUpperCase() ?? 'S'}
                    </span>
                    <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{user?.name ?? 'Shipper'}</p>
                        {vehiclePlate && (
                            <p className="flex items-center gap-1 text-xs text-slate-500">
                                <Truck size={12} /> {vehiclePlate}
                            </p>
                        )}
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-red-600 dark:hover:bg-slate-800"
                >
                    <LogOut size={18} />
                </button>
            </header>

            {/* Content */}
            <main className="flex-1 px-3 py-4 pb-20">{children}</main>

            {/* Bottom tab bar */}
            <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-slate-200 bg-white/95 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/95">
                {tabs.map((tab) => {
                    const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/');
                    const Icon = tab.icon;
                    return (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors ${
                                isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'
                            }`}
                        >
                            <Icon size={22} />
                            {tab.label}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
