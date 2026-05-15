'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Layout, Menu, Avatar, Dropdown, Badge, Button } from 'antd';
import type { MenuProps } from 'antd';
import {
    DashboardOutlined,
    SettingOutlined,
    TeamOutlined,
    ApiOutlined,
    AppstoreAddOutlined,
    HomeOutlined,
    FileTextOutlined,
    StarOutlined,
    WarningOutlined,
    ShopOutlined,
    CarOutlined,
    InboxOutlined,
    DollarOutlined,
    BranchesOutlined,
    SendOutlined,
    RadarChartOutlined,
    EnvironmentOutlined,
    StopOutlined,
    BarChartOutlined,
    DatabaseOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    UserOutlined,
    LogoutOutlined,
    BellOutlined,
    MessageOutlined,
    SafetyOutlined,
} from '@ant-design/icons';

const { Header, Sider, Content } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

function getItem(
    label: React.ReactNode,
    key: string,
    icon?: React.ReactNode,
    children?: MenuItem[],
): MenuItem {
    return {
        key,
        icon,
        children,
        label,
    } as MenuItem;
}

const menuItems: MenuItem[] = [
    getItem('Dashboard', '/logistics/dashboard', <DashboardOutlined />),

    {
        type: 'divider',
    },

    getItem('Quản lý hệ thống', 'system-group', <SettingOutlined />, [
        getItem('Người dùng & Vai trò', '/logistics/users', <TeamOutlined />),
        getItem('API Keys', '/logistics/api-keys', <ApiOutlined />),
        getItem('Tích hợp', '/logistics/integrations', <AppstoreAddOutlined />),
        getItem('Cài đặt', '/logistics/settings', <SettingOutlined />),
    ]),

    getItem('Nội dung & Cộng đồng', 'content-group', <MessageOutlined />, [
        getItem('Quản lý Trạm', '/logistics/stations', <HomeOutlined />),
        getItem('Bài viết', '/logistics/articles', <FileTextOutlined />),
        getItem('Đánh giá', '/logistics/reviews', <StarOutlined />),
        getItem('Báo lỗi', '/logistics/reports', <WarningOutlined />),
    ]),

    getItem('Vận hành Logistics', 'operations-group', <CarOutlined />, [
        getItem('Cơ sở Logistics', '/logistics/facilities', <ShopOutlined />),
        getItem('Gợi ý Cơ sở', '/logistics/facility-suggest', <EnvironmentOutlined />),
        getItem('Đội xe', '/logistics/vehicles', <CarOutlined />),
        getItem('Tuyến đường', '/logistics/routes', <BranchesOutlined />),
        getItem('Đơn hàng', '/logistics/orders', <InboxOutlined />),
        getItem('Báo giá', '/logistics/quotes', <DollarOutlined />),
        getItem('Tối ưu tuyến', '/logistics/optimize', <BranchesOutlined />),
        getItem('Điều phối', '/logistics/dispatch', <SendOutlined />),
        getItem('Giám sát Realtime', '/logistics/monitor', <RadarChartOutlined />),
    ]),

    getItem('Quy định & Báo cáo', 'reports-group', <SafetyOutlined />, [
        getItem('Vùng & Zone', '/logistics/zones', <EnvironmentOutlined />),
        getItem('Quản lý cấm đường', '/logistics/restrictions', <StopOutlined />),
        getItem('Báo cáo & KPI', '/logistics/reports-kpi', <BarChartOutlined />),
        getItem('Dữ liệu nghiên cứu', '/logistics/research', <DatabaseOutlined />),
    ]),
];

export function AntdLogisticsLayout({ children }: { children: React.ReactNode }) {
    const [collapsed, setCollapsed] = useState(false);
    const pathname = usePathname();
    const router = useRouter();

    const handleMenuClick: MenuProps['onClick'] = (e) => {
        router.push(e.key);
    };

    // Get selected keys based on current path
    const selectedKeys = [pathname];

    // Get open keys based on current path
    const getOpenKeys = () => {
        if (pathname.includes('/logistics/users') || pathname.includes('/logistics/api-keys') ||
            pathname.includes('/logistics/integrations') || pathname.includes('/logistics/settings')) {
            return ['system-group'];
        }
        if (pathname.includes('/logistics/stations') || pathname.includes('/logistics/articles') ||
            pathname.includes('/logistics/reviews') || pathname.includes('/logistics/reports')) {
            return ['content-group'];
        }
        if (pathname.includes('/logistics/facilities') || pathname.includes('/logistics/vehicles') ||
            pathname.includes('/logistics/orders') || pathname.includes('/logistics/routes') ||
            pathname.includes('/logistics/quotes') || pathname.includes('/logistics/optimize') ||
            pathname.includes('/logistics/dispatch') || pathname.includes('/logistics/monitor') ||
            pathname.includes('/logistics/facility-suggest')) {
            return ['operations-group'];
        }
        if (pathname.includes('/logistics/zones') || pathname.includes('/logistics/restrictions') ||
            pathname.includes('/logistics/reports-kpi') || pathname.includes('/logistics/research')) {
            return ['reports-group'];
        }
        return [];
    };

    const userMenu: MenuProps['items'] = [
        {
            key: 'profile',
            icon: <UserOutlined />,
            label: 'Thông tin cá nhân',
        },
        {
            key: 'settings',
            icon: <SettingOutlined />,
            label: 'Cài đặt',
        },
        {
            type: 'divider',
        },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: 'Đăng xuất',
            danger: true,
        },
    ];

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider
                collapsible
                collapsed={collapsed}
                onCollapse={setCollapsed}
                theme="dark"
                width={256}
                style={{
                    overflow: 'auto',
                    height: '100vh',
                    position: 'fixed',
                    left: 0,
                    top: 0,
                    bottom: 0,
                }}
            >
                <div
                    style={{
                        height: 64,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                >
                    {!collapsed && (
                        <h1 style={{ color: '#fff', fontSize: 18, fontWeight: 600, margin: 0 }}>
                            Urban Logistics
                        </h1>
                    )}
                    {collapsed && (
                        <h1 style={{ color: '#fff', fontSize: 18, fontWeight: 600, margin: 0 }}>
                            UL
                        </h1>
                    )}
                </div>
                <Menu
                    theme="dark"
                    mode="inline"
                    selectedKeys={selectedKeys}
                    defaultOpenKeys={getOpenKeys()}
                    onClick={handleMenuClick}
                    items={menuItems}
                    style={{ borderRight: 0 }}
                />
            </Sider>
            <Layout style={{ marginLeft: collapsed ? 80 : 256, transition: 'margin-left 0.2s' }}>
                <Header
                    style={{
                        padding: '0 24px',
                        background: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: '1px solid #f0f0f0',
                        position: 'sticky',
                        top: 0,
                        zIndex: 1,
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <Button
                            type="text"
                            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                            onClick={() => setCollapsed(!collapsed)}
                            style={{ fontSize: 16, width: 48, height: 48 }}
                        />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <Badge count={5}>
                            <Button type="text" icon={<BellOutlined />} size="large" />
                        </Badge>
                        <Dropdown menu={{ items: userMenu }} placement="bottomRight">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                <Avatar style={{ backgroundColor: '#1677ff' }} icon={<UserOutlined />} />
                                <span style={{ fontWeight: 500 }}>Admin</span>
                            </div>
                        </Dropdown>
                    </div>
                </Header>
                <Content
                    style={{
                        margin: '24px 24px 0',
                        overflow: 'initial',
                    }}
                >
                    {children}
                </Content>
                <div style={{ padding: '24px', textAlign: 'center', color: '#999' }}>
                    Urban Logistics ©2026 - Hệ thống quản lý logistics đô thị
                </div>
            </Layout>
        </Layout>
    );
}
