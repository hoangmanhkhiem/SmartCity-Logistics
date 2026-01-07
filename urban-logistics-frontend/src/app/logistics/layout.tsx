'use client';

import { ReactNode } from 'react';
import { Sidebar, logisticsNavItems, Header } from '@/components/shared';

export default function LogisticsLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
            <Sidebar title="Logistics" navItems={logisticsNavItems} />
            <div className="flex-1 flex flex-col">
                <Header title="Công ty Logistics" />
                <main className="flex-1 p-6">{children}</main>
            </div>
        </div>
    );
}
