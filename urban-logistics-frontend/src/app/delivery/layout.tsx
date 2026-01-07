'use client';

import { ReactNode } from 'react';
import { Sidebar, deliveryNavItems, Header } from '@/components/shared';

export default function DeliveryLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
            <Sidebar title="Giao hàng" navItems={deliveryNavItems} />
            <div className="flex-1 flex flex-col">
                <Header title="Công ty Giao hàng" />
                <main className="flex-1 p-6">{children}</main>
            </div>
        </div>
    );
}
