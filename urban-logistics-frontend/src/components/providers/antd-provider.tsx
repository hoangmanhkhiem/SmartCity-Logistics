'use client';

import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { antdTheme } from '@/lib/antd-theme';

export function AntdProvider({ children }: { children: React.ReactNode }) {
    return (
        <ConfigProvider theme={antdTheme} locale={viVN}>
            {children}
        </ConfigProvider>
    );
}
