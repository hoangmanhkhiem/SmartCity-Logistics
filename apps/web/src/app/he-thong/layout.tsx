'use client';

import { ReactNode } from 'react';
import { StudioShell, adminNavGroups } from '@/components/studio/shell';

export default function HeThongLayout({ children }: { children: ReactNode }) {
    return (
        <StudioShell group="QUẢN TRỊ HỆ THỐNG" role="Quản trị hệ thống" groups={adminNavGroups}>
            {children}
        </StudioShell>
    );
}
