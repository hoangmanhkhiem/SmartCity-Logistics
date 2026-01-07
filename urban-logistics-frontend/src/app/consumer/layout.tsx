'use client';

import { ReactNode } from 'react';
import { Sidebar, consumerNavItems, Header } from '@/components/shared';

export default function ConsumerLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
            <Sidebar title="Consumer" navItems={consumerNavItems} />
            <div className="flex-1 flex flex-col">
                <Header title="Người dùng" />
                <main className="flex-1 p-6">{children}</main>
            </div>
        </div>
    );
}
