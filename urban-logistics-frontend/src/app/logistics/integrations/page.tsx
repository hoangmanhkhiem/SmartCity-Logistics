'use client';

import { useCallback, useEffect, useState } from 'react';
import {
    Card,
    Table,
    Button,
    Space,
    Input,
    Alert,
    Form,
    Row,
    Col,
    Statistic,
    Typography,
    message,
    Tag,
} from 'antd';
import {
    ApiOutlined,
    PlusOutlined,
    CopyOutlined,
    ShoppingOutlined,
    LinkOutlined,
    SafetyOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { integrationsApi } from '@/lib/api';

const { Title, Text } = Typography;

type ClientRow = {
    id: string;
    name: string;
    keyPrefix: string;
    isActive: boolean;
    createdAt: string;
    _count?: { orders: number };
};

export default function LogisticsIntegrationsPage() {
    const [clients, setClients] = useState<ClientRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [createdKey, setCreatedKey] = useState<string | null>(null);
    const [form] = Form.useForm();

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await integrationsApi.listApiClients();
            setClients(res.data);
        } catch (e) {
            console.error(e);
            message.error('Không thể tải danh sách API clients');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const handleCreate = async (values: { name: string }) => {
        try {
            const res = await integrationsApi.createApiClient(values.name.trim());
            setCreatedKey(res.data.apiKey);
            form.resetFields();
            load();
            message.success('Đã tạo API client thành công');
        } catch (err) {
            console.error(err);
            message.error('Có lỗi khi tạo API client');
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        message.success('Đã sao chép API key vào clipboard');
    };

    const columns: ColumnsType<ClientRow> = [
        {
            title: 'Tên đối tác',
            dataIndex: 'name',
            key: 'name',
            render: (text) => (
                <div>
                    <div style={{ fontWeight: 500 }}>{text}</div>
                    <Tag color="blue">B2B Partner</Tag>
                </div>
            ),
        },
        {
            title: 'Key Prefix',
            dataIndex: 'keyPrefix',
            key: 'keyPrefix',
            render: (text) => (
                <code style={{ background: '#f5f5f5', padding: '4px 8px', borderRadius: 4 }}>
                    {text}…
                </code>
            ),
        },
        {
            title: 'Đơn qua API',
            key: '_count',
            render: (_, record) => (
                <Space>
                    <ShoppingOutlined style={{ color: '#1677ff' }} />
                    <span>{record._count?.orders ?? 0}</span>
                </Space>
            ),
            sorter: (a, b) => (a._count?.orders ?? 0) - (b._count?.orders ?? 0),
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date) => new Date(date).toLocaleString('vi-VN'),
            sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'isActive',
            key: 'isActive',
            render: (isActive) => (
                <Tag color={isActive ? 'success' : 'default'}>
                    {isActive ? 'Hoạt động' : 'Vô hiệu'}
                </Tag>
            ),
        },
    ];

    const totalOrders = clients.reduce((sum, c) => sum + (c._count?.orders ?? 0), 0);
    const activeClients = clients.filter((c) => c.isActive).length;

    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* Header */}
            <div>
                <Title level={2} style={{ margin: 0 }}>
                    API Tích hợp (B2B)
                </Title>
                <Text type="secondary">
                    Tạo khóa cho shop / sàn TMĐT — gọi{' '}
                    <code style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: 4 }}>
                        POST /api/v1/partner/orders
                    </code>{' '}
                    với header{' '}
                    <code style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: 4 }}>
                        X-Api-Key
                    </code>
                </Text>
            </div>

            {/* Statistics */}
            <Row gutter={16}>
                <Col xs={24} sm={8}>
                    <Card variant="borderless">
                        <Statistic
                            title="Tổng API Clients"
                            value={clients.length}
                            prefix={<ApiOutlined style={{ color: '#1677ff' }} />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card variant="borderless">
                        <Statistic
                            title="Đang hoạt động"
                            value={activeClients}
                            prefix={<LinkOutlined style={{ color: '#52c41a' }} />}
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card variant="borderless">
                        <Statistic
                            title="Tổng đơn qua API"
                            value={totalOrders}
                            prefix={<ShoppingOutlined style={{ color: '#faad14' }} />}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Created Key Alert */}
            {createdKey && (
                <Alert
                    message="Lưu ngay — chỉ hiện một lần!"
                    description={
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <code
                                style={{
                                    display: 'block',
                                    padding: 12,
                                    background: '#fff',
                                    borderRadius: 4,
                                    wordBreak: 'break-all',
                                }}
                            >
                                {createdKey}
                            </code>
                            <Space>
                                <Button
                                    icon={<CopyOutlined />}
                                    onClick={() => copyToClipboard(createdKey)}
                                >
                                    Sao chép
                                </Button>
                                <Button onClick={() => setCreatedKey(null)}>Đã lưu</Button>
                            </Space>
                        </Space>
                    }
                    type="warning"
                    icon={<SafetyOutlined />}
                    showIcon
                    closable
                    onClose={() => setCreatedKey(null)}
                />
            )}

            {/* Create Form */}
            <Card title={<><PlusOutlined /> Tạo API Client mới</>}>
                <Form form={form} layout="inline" onFinish={handleCreate}>
                    <Form.Item
                        name="name"
                        rules={[{ required: true, message: 'Vui lòng nhập tên' }]}
                        style={{ flex: 1, minWidth: 250 }}
                    >
                        <Input
                            placeholder="Tên đối tác (vd: Shop Shopee ABC)"
                            size="large"
                        />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" size="large" icon={<PlusOutlined />}>
                            Tạo khóa
                        </Button>
                    </Form.Item>
                </Form>
            </Card>

            {/* Table */}
            <Card title="Danh sách API Clients">
                <Table
                    columns={columns}
                    dataSource={clients}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        pageSize: 10,
                        showTotal: (total) => `Tổng ${total} clients`,
                    }}
                    locale={{ emptyText: 'Chưa có client nào' }}
                />
            </Card>
        </Space>
    );
}
