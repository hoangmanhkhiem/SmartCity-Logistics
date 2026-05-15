import type { ThemeConfig } from 'antd';

export const antdTheme: ThemeConfig = {
    token: {
        // Primary colors - Blue for logistics/transport
        colorPrimary: '#1677ff',
        colorSuccess: '#52c41a',
        colorWarning: '#faad14',
        colorError: '#ff4d4f',
        colorInfo: '#1677ff',

        // Layout
        borderRadius: 8,

        // Typography
        fontSize: 14,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',

        // Spacing
        padding: 16,
        margin: 16,

        // Shadow
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)',
    },
    components: {
        Layout: {
            siderBg: '#001529',
            triggerBg: '#002140',
            headerBg: '#fff',
            bodyBg: '#f0f2f5',
        },
        Menu: {
            darkItemBg: '#001529',
            darkItemSelectedBg: '#1677ff',
            darkItemHoverBg: '#003a70',
        },
        Card: {
            borderRadius: 8,
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)',
        },
        Button: {
            borderRadius: 6,
        },
        Table: {
            borderRadius: 8,
        },
    },
};
