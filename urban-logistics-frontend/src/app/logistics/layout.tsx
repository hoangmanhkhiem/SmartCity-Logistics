'use client';

import { ReactNode } from 'react';
import { AntdProvider } from '@/components/providers/antd-provider';
import { AntdLogisticsLayout } from '@/components/logistics/antd-layout';

export default function LogisticsLayout({ children }: { children: ReactNode }) {
    return (
        <AntdProvider>
            <AntdLogisticsLayout>{children}</AntdLogisticsLayout>
        </AntdProvider>
    );
}
