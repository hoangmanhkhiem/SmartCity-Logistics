'use client';

import { ReactNode } from 'react';
import { Sidebar, logisticsNavItems, Header } from '@/components/shared';

export default function LogisticsLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
            <Sidebar title="Admin nền tảng" navItems={logisticsNavItems} />
            <div className="flex-1 flex flex-col">
                <Header title="Quản trị nền tảng" />
                <main className="flex-1 p-6">{children}</main>
            </div>
        </div>
    );
}
