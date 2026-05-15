'use client';

import { useState } from 'react';
import {
    Card,
    Table,
    Button,
    Space,
    Input,
    Tag,
    Row,
    Col,
    Statistic,
    Typography,
    Modal,
    Form,
    Select,
    Badge,
    Avatar,
    Tooltip,
} from 'antd';
import {
    FileTextOutlined,
    PlusOutlined,
    SearchOutlined,
    UserOutlined,
    EyeOutlined,
    EditOutlined,
    DeleteOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;
const { Search } = Input;
const { TextArea } = Input;

interface Article {
    id: string;
    title: string;
    author: string;
    createdAt: string;
    status: 'published' | 'draft';
    views: number;
}

export default function ArticlesPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [form] = Form.useForm();
    const [articles] = useState<Article[]>([
        {
            id: '1',
            title: 'Hướng dẫn sử dụng hệ thống',
            author: 'Admin',
            createdAt: '2024-03-01',
            status: 'published',
            views: 150,
        },
        {
            id: '2',
            title: 'Chính sách vận chuyển mới',
            author: 'Admin',
            createdAt: '2024-03-05',
            status: 'draft',
            views: 0,
        },
        {
            id: '3',
            title: 'Quy định về thời gian giao hàng',
            author: 'Manager',
            createdAt: '2024-03-08',
            status: 'published',
            views: 89,
        },
    ]);

    const columns: ColumnsType<Article> = [
        {
            title: 'Tiêu đề',
            dataIndex: 'title',
            key: 'title',
            render: (text, record) => (
                <div>
                    <div style={{ fontWeight: 500, marginBottom: 4 }}>{text}</div>
                    <Space size={4}>
                        <Avatar size="small" icon={<UserOutlined />} />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            {record.author}
                        </Text>
                    </Space>
                </div>
            ),
            sorter: (a, b) => a.title.localeCompare(b.title),
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
            render: (status) =>
                status === 'published' ? (
                    <Tag icon={<CheckCircleOutlined />} color="success">
                        Đã xuất bản
                    </Tag>
                ) : (
                    <Tag icon={<ClockCircleOutlined />} color="warning">
                        Nháp
                    </Tag>
                ),
            filters: [
                { text: 'Đã xuất bản', value: 'published' },
                { text: 'Nháp', value: 'draft' },
            ],
            onFilter: (value, record) => record.status === value,
        },
        {
            title: 'Lượt xem',
            dataIndex: 'views',
            key: 'views',
            render: (views) => (
                <Space>
                    <EyeOutlined style={{ color: '#1677ff' }} />
                    <Text strong>{views}</Text>
                </Space>
            ),
            sorter: (a, b) => a.views - b.views,
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: () => (
                <Space size="small">
                    <Tooltip title="Chỉnh sửa">
                        <Button type="link" size="small" icon={<EditOutlined />} />
                    </Tooltip>
                    <Tooltip title="Xóa">
                        <Button type="link" size="small" danger icon={<DeleteOutlined />} />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    const filteredArticles = articles.filter((a) =>
        a.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalViews = articles.reduce((sum, a) => sum + a.views, 0);
    const publishedCount = articles.filter((a) => a.status === 'published').length;

    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <Title level={2} style={{ margin: 0 }}>
                        Quản lý Bài viết
                    </Title>
                    <Text type="secondary">Danh sách bài viết hệ thống</Text>
                </div>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    size="large"
                    onClick={() => setModalOpen(true)}
                >
                    Tạo bài viết
                </Button>
            </div>

            {/* Statistics */}
            <Row gutter={16}>
                <Col xs={24} sm={8}>
                    <Card variant="borderless">
                        <Statistic
                            title="Tổng bài viết"
                            value={articles.length}
                            prefix={<FileTextOutlined style={{ color: '#722ed1' }} />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card variant="borderless">
                        <Statistic
                            title="Đã xuất bản"
                            value={publishedCount}
                            prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card variant="borderless">
                        <Statistic
                            title="Tổng lượt xem"
                            value={totalViews}
                            prefix={<EyeOutlined style={{ color: '#faad14' }} />}
                            valueStyle={{ color: '#faad14' }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Table */}
            <Card>
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <Search
                        placeholder="Tìm bài viết..."
                        allowClear
                        enterButton={<SearchOutlined />}
                        size="large"
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ maxWidth: 500 }}
                    />
                    <Table
                        columns={columns}
                        dataSource={filteredArticles}
                        rowKey="id"
                        pagination={{
                            pageSize: 10,
                            showTotal: (total) => `Tổng ${total} bài viết`,
                        }}
                    />
                </Space>
            </Card>

            {/* Create Modal */}
            <Modal
                title="Tạo bài viết mới"
                open={modalOpen}
                onCancel={() => {
                    setModalOpen(false);
                    form.resetFields();
                }}
                onOk={() => form.submit()}
                width={800}
            >
                <Form form={form} layout="vertical" onFinish={() => console.log('Create article')}>
                    <Form.Item
                        label="Tiêu đề"
                        name="title"
                        rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}
                    >
                        <Input placeholder="Nhập tiêu đề bài viết" />
                    </Form.Item>

                    <Form.Item
                        label="Nội dung"
                        name="content"
                        rules={[{ required: true, message: 'Vui lòng nhập nội dung' }]}
                    >
                        <TextArea rows={8} placeholder="Nhập nội dung bài viết..." />
                    </Form.Item>

                    <Form.Item
                        label="Trạng thái"
                        name="status"
                        rules={[{ required: true }]}
                        initialValue="draft"
                    >
                        <Select>
                            <Select.Option value="draft">Lưu nháp</Select.Option>
                            <Select.Option value="published">Xuất bản ngay</Select.Option>
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
        </Space>
    );
}
