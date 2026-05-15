'use client';

import { useState } from 'react';
import {
    Card,
    Table,
    Button,
    Space,
    Tag,
    Row,
    Col,
    Statistic,
    Typography,
    Avatar,
    Drawer,
    Descriptions,
    Select,
    message,
} from 'antd';
import {
    WarningOutlined,
    UserOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    ExclamationCircleOutlined,
    EyeOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text, Paragraph } = Typography;

interface Report {
    id: string;
    user: string;
    title: string;
    description: string;
    createdAt: string;
    status: 'open' | 'in_progress' | 'resolved';
    priority: 'low' | 'medium' | 'high';
}

export default function ReportsPage() {
    const [reports, setReports] = useState<Report[]>([
        {
            id: '1',
            user: 'Nguyễn Văn A',
            title: 'Lỗi hiển thị bản đồ',
            description: 'Bản đồ không load được khi vào trang theo dõi đơn hàng',
            createdAt: '2024-03-10',
            status: 'in_progress',
            priority: 'high',
        },
        {
            id: '2',
            user: 'Trần Thị B',
            title: 'Không gửi được đơn hàng',
            description: 'Form gửi đơn bị lỗi khi nhấn nút submit',
            createdAt: '2024-03-11',
            status: 'open',
            priority: 'medium',
        },
        {
            id: '3',
            user: 'Lê Văn C',
            title: 'Lỗi hiển thị giá',
            description: 'Giá hiển thị sai khi áp dụng voucher',
            createdAt: '2024-03-09',
            status: 'resolved',
            priority: 'low',
        },
    ]);
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const handleStatusChange = (id: string, newStatus: Report['status']) => {
        setReports(reports.map((r) => (r.id === id ? { ...r, status: newStatus } : r)));
        message.success('Đã cập nhật trạng thái');
    };

    const columns: ColumnsType<Report> = [
        {
            title: 'Người báo',
            dataIndex: 'user',
            key: 'user',
            render: (name) => (
                <Space>
                    <Avatar style={{ backgroundColor: '#ff4d4f' }} icon={<UserOutlined />}>
                        {name.charAt(0)}
                    </Avatar>
                    <Text strong>{name}</Text>
                </Space>
            ),
        },
        {
            title: 'Tiêu đề',
            dataIndex: 'title',
            key: 'title',
            render: (text, record) => (
                <div>
                    <div style={{ fontWeight: 500 }}>{text}</div>
                    <Paragraph
                        ellipsis={{ rows: 1 }}
                        type="secondary"
                        style={{ margin: 0, fontSize: 12 }}
                    >
                        {record.description}
                    </Paragraph>
                </div>
            ),
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'createdAt',
            key: 'createdAt',
            sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        },
        {
            title: 'Độ ưu tiên',
            dataIndex: 'priority',
            key: 'priority',
            render: (priority) => {
                const config = {
                    high: { color: 'error', text: 'Cao' },
                    medium: { color: 'warning', text: 'Trung bình' },
                    low: { color: 'default', text: 'Thấp' },
                };
                const { color, text } = config[priority as keyof typeof config];
                return <Tag color={color}>{text}</Tag>;
            },
            filters: [
                { text: 'Cao', value: 'high' },
                { text: 'Trung bình', value: 'medium' },
                { text: 'Thấp', value: 'low' },
            ],
            onFilter: (value, record) => record.priority === value,
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status, record) => (
                <Select
                    value={status}
                    onChange={(value) => handleStatusChange(record.id, value)}
                    style={{ width: 140 }}
                    size="small"
                >
                    <Select.Option value="open">
                        <Tag color="default" icon={<ExclamationCircleOutlined />}>
                            Mới
                        </Tag>
                    </Select.Option>
                    <Select.Option value="in_progress">
                        <Tag color="processing" icon={<ClockCircleOutlined />}>
                            Đang xử lý
                        </Tag>
                    </Select.Option>
                    <Select.Option value="resolved">
                        <Tag color="success" icon={<CheckCircleOutlined />}>
                            Đã giải quyết
                        </Tag>
                    </Select.Option>
                </Select>
            ),
            filters: [
                { text: 'Mới', value: 'open' },
                { text: 'Đang xử lý', value: 'in_progress' },
                { text: 'Đã giải quyết', value: 'resolved' },
            ],
            onFilter: (value, record) => record.status === value,
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_, record) => (
                <Button
                    type="link"
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() => {
                        setSelectedReport(record);
                        setDrawerOpen(true);
                    }}
                >
                    Chi tiết
                </Button>
            ),
        },
    ];

    const openCount = reports.filter((r) => r.status === 'open').length;
    const inProgressCount = reports.filter((r) => r.status === 'in_progress').length;
    const resolvedCount = reports.filter((r) => r.status === 'resolved').length;

    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* Header */}
            <div>
                <Title level={2} style={{ margin: 0 }}>
                    Quản lý Báo lỗi
                </Title>
                <Text type="secondary">Danh sách báo lỗi từ người dùng</Text>
            </div>

            {/* Statistics */}
            <Row gutter={16}>
                <Col xs={24} sm={6}>
                    <Card variant="borderless">
                        <Statistic
                            title="Tổng báo lỗi"
                            value={reports.length}
                            prefix={<WarningOutlined style={{ color: '#ff4d4f' }} />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={6}>
                    <Card variant="borderless">
                        <Statistic
                            title="Chờ xử lý"
                            value={openCount}
                            prefix={<ExclamationCircleOutlined style={{ color: '#faad14' }} />}
                            valueStyle={{ color: '#faad14' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={6}>
                    <Card variant="borderless">
                        <Statistic
                            title="Đang xử lý"
                            value={inProgressCount}
                            prefix={<ClockCircleOutlined style={{ color: '#1677ff' }} />}
                            valueStyle={{ color: '#1677ff' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={6}>
                    <Card variant="borderless">
                        <Statistic
                            title="Đã giải quyết"
                            value={resolvedCount}
                            prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Table */}
            <Card title="Danh sách báo lỗi">
                <Table
                    columns={columns}
                    dataSource={reports}
                    rowKey="id"
                    pagination={{
                        pageSize: 10,
                        showTotal: (total) => `Tổng ${total} báo lỗi`,
                    }}
                />
            </Card>

            {/* Detail Drawer */}
            <Drawer
                title="Chi tiết báo lỗi"
                placement="right"
                width={500}
                onClose={() => setDrawerOpen(false)}
                open={drawerOpen}
            >
                {selectedReport && (
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                        <Descriptions column={1} bordered>
                            <Descriptions.Item label="Tiêu đề">
                                <Text strong>{selectedReport.title}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Người báo">
                                <Space>
                                    <Avatar size="small" icon={<UserOutlined />} />
                                    {selectedReport.user}
                                </Space>
                            </Descriptions.Item>
                            <Descriptions.Item label="Ngày tạo">
                                {selectedReport.createdAt}
                            </Descriptions.Item>
                            <Descriptions.Item label="Độ ưu tiên">
                                <Tag
                                    color={
                                        selectedReport.priority === 'high'
                                            ? 'error'
                                            : selectedReport.priority === 'medium'
                                            ? 'warning'
                                            : 'default'
                                    }
                                >
                                    {selectedReport.priority === 'high'
                                        ? 'Cao'
                                        : selectedReport.priority === 'medium'
                                        ? 'Trung bình'
                                        : 'Thấp'}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Trạng thái">
                                <Tag
                                    color={
                                        selectedReport.status === 'resolved'
                                            ? 'success'
                                            : selectedReport.status === 'in_progress'
                                            ? 'processing'
                                            : 'default'
                                    }
                                    icon={
                                        selectedReport.status === 'resolved' ? (
                                            <CheckCircleOutlined />
                                        ) : selectedReport.status === 'in_progress' ? (
                                            <ClockCircleOutlined />
                                        ) : (
                                            <ExclamationCircleOutlined />
                                        )
                                    }
                                >
                                    {selectedReport.status === 'resolved'
                                        ? 'Đã giải quyết'
                                        : selectedReport.status === 'in_progress'
                                        ? 'Đang xử lý'
                                        : 'Mới'}
                                </Tag>
                            </Descriptions.Item>
                        </Descriptions>

                        <div>
                            <Text strong>Mô tả chi tiết:</Text>
                            <Paragraph style={{ marginTop: 8 }}>{selectedReport.description}</Paragraph>
                        </div>

                        <Space>
                            <Button
                                type="primary"
                                onClick={() =>
                                    handleStatusChange(selectedReport.id, 'in_progress')
                                }
                            >
                                Bắt đầu xử lý
                            </Button>
                            <Button
                                onClick={() => handleStatusChange(selectedReport.id, 'resolved')}
                            >
                                Đánh dấu đã giải quyết
                            </Button>
                        </Space>
                    </Space>
                )}
            </Drawer>
        </Space>
    );
}
