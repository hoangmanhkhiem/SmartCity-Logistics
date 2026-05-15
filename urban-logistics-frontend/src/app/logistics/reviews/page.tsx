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
    Rate,
    Avatar,
    Tooltip,
    Popconfirm,
    message,
} from 'antd';
import {
    StarOutlined,
    UserOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    ClockCircleOutlined,
    LikeOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text, Paragraph } = Typography;

interface Review {
    id: string;
    user: string;
    rating: number;
    comment: string;
    createdAt: string;
    status: 'approved' | 'pending' | 'rejected';
}

export default function ReviewsPage() {
    const [reviews, setReviews] = useState<Review[]>([
        {
            id: '1',
            user: 'Nguyễn Văn A',
            rating: 5,
            comment: 'Dịch vụ tốt, giao hàng nhanh',
            createdAt: '2024-03-10',
            status: 'approved',
        },
        {
            id: '2',
            user: 'Trần Thị B',
            rating: 4,
            comment: 'Ổn, nhưng cần cải thiện thời gian',
            createdAt: '2024-03-11',
            status: 'pending',
        },
        {
            id: '3',
            user: 'Lê Văn C',
            rating: 3,
            comment: 'Bình thường, không có gì đặc biệt',
            createdAt: '2024-03-12',
            status: 'rejected',
        },
    ]);

    const handleApprove = (id: string) => {
        setReviews(reviews.map((r) => (r.id === id ? { ...r, status: 'approved' as const } : r)));
        message.success('Đã duyệt đánh giá');
    };

    const handleReject = (id: string) => {
        setReviews(reviews.map((r) => (r.id === id ? { ...r, status: 'rejected' as const } : r)));
        message.warning('Đã từ chối đánh giá');
    };

    const columns: ColumnsType<Review> = [
        {
            title: 'Người dùng',
            dataIndex: 'user',
            key: 'user',
            render: (name) => (
                <Space>
                    <Avatar style={{ backgroundColor: '#1677ff' }} icon={<UserOutlined />}>
                        {name.charAt(0)}
                    </Avatar>
                    <Text strong>{name}</Text>
                </Space>
            ),
        },
        {
            title: 'Đánh giá',
            dataIndex: 'rating',
            key: 'rating',
            render: (rating) => <Rate disabled value={rating} style={{ fontSize: 16 }} />,
            sorter: (a, b) => a.rating - b.rating,
        },
        {
            title: 'Nhận xét',
            dataIndex: 'comment',
            key: 'comment',
            render: (text) => (
                <Paragraph ellipsis={{ rows: 2 }} style={{ margin: 0, maxWidth: 300 }}>
                    {text}
                </Paragraph>
            ),
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'createdAt',
            key: 'createdAt',
            sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                const config = {
                    approved: { color: 'success', icon: <CheckCircleOutlined />, text: 'Đã duyệt' },
                    pending: { color: 'warning', icon: <ClockCircleOutlined />, text: 'Chờ duyệt' },
                    rejected: { color: 'error', icon: <CloseCircleOutlined />, text: 'Từ chối' },
                };
                const { color, icon, text } = config[status as keyof typeof config];
                return (
                    <Tag color={color} icon={icon}>
                        {text}
                    </Tag>
                );
            },
            filters: [
                { text: 'Đã duyệt', value: 'approved' },
                { text: 'Chờ duyệt', value: 'pending' },
                { text: 'Từ chối', value: 'rejected' },
            ],
            onFilter: (value, record) => record.status === value,
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_, record) => (
                <Space size="small">
                    {record.status !== 'approved' && (
                        <Tooltip title="Duyệt">
                            <Button
                                type="link"
                                size="small"
                                icon={<CheckCircleOutlined />}
                                onClick={() => handleApprove(record.id)}
                            >
                                Duyệt
                            </Button>
                        </Tooltip>
                    )}
                    {record.status !== 'rejected' && (
                        <Popconfirm
                            title="Từ chối đánh giá"
                            description="Bạn có chắc muốn từ chối đánh giá này?"
                            onConfirm={() => handleReject(record.id)}
                            okText="Từ chối"
                            cancelText="Hủy"
                            okButtonProps={{ danger: true }}
                        >
                            <Button type="link" size="small" danger icon={<CloseCircleOutlined />}>
                                Từ chối
                            </Button>
                        </Popconfirm>
                    )}
                </Space>
            ),
        },
    ];

    const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
    const approvedCount = reviews.filter((r) => r.status === 'approved').length;
    const pendingCount = reviews.filter((r) => r.status === 'pending').length;

    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* Header */}
            <div>
                <Title level={2} style={{ margin: 0 }}>
                    Quản lý Đánh giá
                </Title>
                <Text type="secondary">Danh sách đánh giá từ người dùng</Text>
            </div>

            {/* Statistics */}
            <Row gutter={16}>
                <Col xs={24} sm={6}>
                    <Card variant="borderless">
                        <Statistic
                            title="Tổng đánh giá"
                            value={reviews.length}
                            prefix={<StarOutlined style={{ color: '#faad14' }} />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={6}>
                    <Card variant="borderless">
                        <Statistic
                            title="Trung bình"
                            value={avgRating.toFixed(1)}
                            prefix={<StarOutlined style={{ color: '#faad14' }} />}
                            suffix={<Rate disabled value={Math.round(avgRating)} style={{ fontSize: 12 }} />}
                            valueStyle={{ color: '#faad14' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={6}>
                    <Card variant="borderless">
                        <Statistic
                            title="Đã duyệt"
                            value={approvedCount}
                            prefix={<LikeOutlined style={{ color: '#52c41a' }} />}
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={6}>
                    <Card variant="borderless">
                        <Statistic
                            title="Chờ duyệt"
                            value={pendingCount}
                            prefix={<ClockCircleOutlined style={{ color: '#ff4d4f' }} />}
                            valueStyle={{ color: '#ff4d4f' }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Table */}
            <Card title="Danh sách đánh giá">
                <Table
                    columns={columns}
                    dataSource={reviews}
                    rowKey="id"
                    pagination={{
                        pageSize: 10,
                        showTotal: (total) => `Tổng ${total} đánh giá`,
                    }}
                />
            </Card>
        </Space>
    );
}
