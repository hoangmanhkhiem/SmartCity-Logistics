'use client';

import { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Progress, Space, Typography, Alert, Spin, Table, Tag, Divider } from 'antd';
import {
    ShoppingOutlined,
    CarOutlined,
    EnvironmentOutlined,
    RiseOutlined,
    FallOutlined,
    WarningOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    ThunderboltOutlined,
} from '@ant-design/icons';
import { analyticsApi } from '@/lib/api';

const { Title, Text } = Typography;

type PlatformSummary = {
    orders?: { total?: number; byStatus?: Record<string, number> };
    vehicles?: { byStatus?: Record<string, number> };
    environment?: { estimatedCo2GramsTotal?: number };
    operations?: { unassignedLegs?: number; telemetryPointsLast24h?: number };
};

export default function LogisticsDashboard() {
    const [summary, setSummary] = useState<PlatformSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [summaryErr, setSummaryErr] = useState(false);

    useEffect(() => {
        analyticsApi
            .getPlatformSummary()
            .then((r) => {
                setSummary(r.data);
                setSummaryErr(false);
            })
            .catch(() => {
                setSummary(null);
                setSummaryErr(true);
            })
            .finally(() => setLoading(false));
    }, []);

    const vehicleTotal = summary?.vehicles?.byStatus
        ? Object.values(summary.vehicles.byStatus).reduce((a, b) => a + b, 0)
        : 0;

    const co2Tons = summary?.environment?.estimatedCo2GramsTotal
        ? (summary.environment.estimatedCo2GramsTotal / 1_000_000).toFixed(2)
        : '0';

    // Mock data for charts
    const recentOrders = [
        { key: '1', id: 'ORD-001', customer: 'Công ty ABC', status: 'delivered', time: '10:30' },
        { key: '2', id: 'ORD-002', customer: 'Cửa hàng XYZ', status: 'in_transit', time: '11:45' },
        { key: '3', id: 'ORD-003', customer: 'Nhà máy DEF', status: 'pending', time: '12:15' },
        { key: '4', id: 'ORD-004', customer: 'Siêu thị GHI', status: 'delivered', time: '13:20' },
        { key: '5', id: 'ORD-005', customer: 'Kho JKL', status: 'in_transit', time: '14:00' },
    ];

    const columns = [
        {
            title: 'Mã đơn',
            dataIndex: 'id',
            key: 'id',
        },
        {
            title: 'Khách hàng',
            dataIndex: 'customer',
            key: 'customer',
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
                const statusConfig: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
                    delivered: { color: 'success', label: 'Đã giao', icon: <CheckCircleOutlined /> },
                    in_transit: { color: 'processing', label: 'Đang giao', icon: <ClockCircleOutlined /> },
                    pending: { color: 'warning', label: 'Chờ xử lý', icon: <WarningOutlined /> },
                };
                const config = statusConfig[status] || statusConfig.pending;
                return <Tag color={config.color} icon={config.icon}>{config.label}</Tag>;
            },
        },
        {
            title: 'Thời gian',
            dataIndex: 'time',
            key: 'time',
        },
    ];

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '100px 0' }}>
                <Spin size="large" />
                <div style={{ marginTop: 16, color: '#666' }}>Đang tải dữ liệu...</div>
            </div>
        );
    }

    return (
        <Space direction="vertical" size="large" style={{ width: '100%', paddingBottom: 24 }}>
            {/* Header */}
            <div>
                <Title level={2} style={{ margin: 0 }}>Dashboard</Title>
                <Text type="secondary">Tổng quan hệ thống logistics đô thị</Text>
            </div>

            {summaryErr && (
                <Alert
                    message="Không thể tải dữ liệu"
                    description="Vui lòng kiểm tra kết nối API hoặc thử lại sau."
                    type="warning"
                    showIcon
                    icon={<WarningOutlined />}
                />
            )}

            {/* KPI Cards */}
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={6}>
                    <Card variant="borderless">
                        <Statistic
                            title="Tổng đơn hàng"
                            value={summary?.orders?.total || 0}
                            prefix={<ShoppingOutlined style={{ color: '#1677ff' }} />}
                            suffix={<Tag color="blue">Hôm nay</Tag>}
                        />
                        <div style={{ marginTop: 12 }}>
                            <Text type="success">
                                <RiseOutlined /> +12.5% so với hôm qua
                            </Text>
                        </div>
                    </Card>
                </Col>

                <Col xs={24} sm={12} lg={6}>
                    <Card variant="borderless">
                        <Statistic
                            title="Đội xe"
                            value={vehicleTotal}
                            prefix={<CarOutlined style={{ color: '#52c41a' }} />}
                            suffix="xe"
                        />
                        <Progress
                            percent={85}
                            strokeColor="#52c41a"
                            format={(percent) => `${percent}% hoạt động`}
                            style={{ marginTop: 12 }}
                        />
                    </Card>
                </Col>

                <Col xs={24} sm={12} lg={6}>
                    <Card variant="borderless">
                        <Statistic
                            title="Phát thải CO₂"
                            value={co2Tons}
                            prefix={<EnvironmentOutlined style={{ color: '#faad14' }} />}
                            suffix="tấn"
                        />
                        <div style={{ marginTop: 12 }}>
                            <Text type="success">
                                <FallOutlined /> -5.2% so với tuần trước
                            </Text>
                        </div>
                    </Card>
                </Col>

                <Col xs={24} sm={12} lg={6}>
                    <Card variant="borderless">
                        <Statistic
                            title="Chờ điều phối"
                            value={summary?.operations?.unassignedLegs || 0}
                            prefix={<WarningOutlined style={{ color: '#ff4d4f' }} />}
                            suffix="legs"
                        />
                        <div style={{ marginTop: 12 }}>
                            <Tag color="red">Cần xử lý ngay</Tag>
                        </div>
                    </Card>
                </Col>
            </Row>

            {/* Secondary Stats */}
            <Row gutter={[16, 16]}>
                <Col xs={24} lg={16}>
                    <Card
                        title="Đơn hàng gần đây"
                        variant="borderless"
                        extra={<a href="/logistics/orders">Xem tất cả</a>}
                    >
                        <Table
                            columns={columns}
                            dataSource={recentOrders}
                            pagination={false}
                            size="small"
                        />
                    </Card>
                </Col>

                <Col xs={24} lg={8}>
                    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                        <Card variant="borderless" title="Hiệu suất hôm nay">
                            <Space direction="vertical" style={{ width: '100%' }} size="small">
                                <div>
                                    <Text type="secondary">Tỷ lệ giao thành công</Text>
                                    <Progress percent={96} strokeColor="#52c41a" />
                                </div>
                                <div>
                                    <Text type="secondary">Đúng giờ</Text>
                                    <Progress percent={88} strokeColor="#1677ff" />
                                </div>
                                <div>
                                    <Text type="secondary">Tối ưu tuyến</Text>
                                    <Progress percent={92} strokeColor="#faad14" />
                                </div>
                            </Space>
                        </Card>

                        <Card variant="borderless">
                            <Statistic
                                title="Telemetry Points"
                                value={summary?.operations?.telemetryPointsLast24h || 0}
                                prefix={<ThunderboltOutlined style={{ color: '#722ed1' }} />}
                                suffix="/ 24h"
                                styles={{ value: { fontSize: 24 } }}
                            />
                        </Card>
                    </Space>
                </Col>
            </Row>

            {/* Status Breakdown */}
            {summary?.orders?.byStatus && (
                <Card title="Phân bố trạng thái đơn hàng" variant="borderless">
                    <Row gutter={16}>
                        {Object.entries(summary.orders.byStatus).map(([status, count]) => (
                            <Col xs={12} sm={8} md={6} lg={4} key={status}>
                                <Card bordered size="small" style={{ textAlign: 'center' }}>
                                    <Statistic
                                        title={status.replace('_', ' ').toUpperCase()}
                                        value={count}
                                        valueStyle={{ fontSize: 20 }}
                                    />
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </Card>
            )}

            {/* Quick Actions */}
            <Card title="Truy cập nhanh" variant="borderless">
                <Row gutter={16}>
                    <Col xs={12} sm={8} md={6}>
                        <Card.Grid
                            style={{ width: '100%', textAlign: 'center', cursor: 'pointer' }}
                            hoverable
                        >
                            <ShoppingOutlined style={{ fontSize: 24, color: '#1677ff' }} />
                            <div style={{ marginTop: 8 }}>Tạo đơn hàng</div>
                        </Card.Grid>
                    </Col>
                    <Col xs={12} sm={8} md={6}>
                        <Card.Grid
                            style={{ width: '100%', textAlign: 'center', cursor: 'pointer' }}
                            hoverable
                        >
                            <CarOutlined style={{ fontSize: 24, color: '#52c41a' }} />
                            <div style={{ marginTop: 8 }}>Quản lý xe</div>
                        </Card.Grid>
                    </Col>
                    <Col xs={12} sm={8} md={6}>
                        <Card.Grid
                            style={{ width: '100%', textAlign: 'center', cursor: 'pointer' }}
                            hoverable
                        >
                            <EnvironmentOutlined style={{ fontSize: 24, color: '#faad14' }} />
                            <div style={{ marginTop: 8 }}>Tối ưu tuyến</div>
                        </Card.Grid>
                    </Col>
                    <Col xs={12} sm={8} md={6}>
                        <Card.Grid
                            style={{ width: '100%', textAlign: 'center', cursor: 'pointer' }}
                            hoverable
                        >
                            <ThunderboltOutlined style={{ fontSize: 24, color: '#722ed1' }} />
                            <div style={{ marginTop: 8 }}>Giám sát</div>
                        </Card.Grid>
                    </Col>
                </Row>
            </Card>
        </Space>
    );
}
