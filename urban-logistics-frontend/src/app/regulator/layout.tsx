'use client';

import { ReactNode } from 'react';
import { Sidebar, regulatorNavItems, Header } from '@/components/shared';

export default function RegulatorLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
            <Sidebar title="Quản lý" navItems={regulatorNavItems} />
            <div className="flex-1 flex flex-col">
                <Header title="Cơ quan Quản lý" />
                <main className="flex-1 p-6">{children}</main>
            </div>
        </div>
    );
}
