'use client';

import { useState } from 'react';
import {
    Card,
    Table,
    Button,
    Space,
    Tag,
    Typography,
    Modal,
    Form,
    Input,
    Select,
    message,
    Popconfirm,
    Row,
    Col,
    Statistic,
    Tooltip,
} from 'antd';
import {
    ApiOutlined,
    PlusOutlined,
    CopyOutlined,
    DeleteOutlined,
    EyeOutlined,
    EyeInvisibleOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface ApiKey {
    id: string;
    name: string;
    key: string;
    environment: 'production' | 'development';
    createdAt: string;
    lastUsed?: string;
    status: 'active' | 'inactive';
    permissions: string[];
}

export default function ApiKeysPage() {
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([
        {
            id: '1',
            name: 'Production API',
            key: 'pk_live_1234567890abcdefghijklmnop',
            environment: 'production',
            createdAt: '2024-01-15',
            lastUsed: '2024-03-10 14:30',
            status: 'active',
            permissions: ['read', 'write'],
        },
        {
            id: '2',
            name: 'Development API',
            key: 'pk_test_abcdef1234567890ghijklmnop',
            environment: 'development',
            createdAt: '2024-02-01',
            lastUsed: '2024-03-11 09:15',
            status: 'active',
            permissions: ['read'],
        },
        {
            id: '3',
            name: 'Legacy API',
            key: 'pk_live_old_1234567890abcdefgh',
            environment: 'production',
            createdAt: '2023-12-01',
            status: 'inactive',
            permissions: ['read'],
        },
    ]);
    const [modalOpen, setModalOpen] = useState(false);
    const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
    const [form] = Form.useForm();

    const toggleKeyVisibility = (id: string) => {
        const newSet = new Set(visibleKeys);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setVisibleKeys(newSet);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        message.success('Đã sao chép vào clipboard');
    };

    const handleDelete = (id: string) => {
        setApiKeys(apiKeys.filter((k) => k.id !== id));
        message.success('Đã xóa API key');
    };

    const columns: ColumnsType<ApiKey> = [
        {
            title: 'Tên',
            dataIndex: 'name',
            key: 'name',
            render: (text, record) => (
                <div>
                    <div style={{ fontWeight: 500 }}>{text}</div>
                    <Tag color={record.environment === 'production' ? 'red' : 'blue'}>
                        {record.environment === 'production' ? 'Production' : 'Development'}
                    </Tag>
                </div>
            ),
        },
        {
            title: 'API Key',
            dataIndex: 'key',
            key: 'key',
            render: (text, record) => (
                <Space>
                    <code style={{ background: '#f5f5f5', padding: '4px 8px', borderRadius: 4 }}>
                        {visibleKeys.has(record.id) ? text : '••••••••••••••••••••'}
                    </code>
                    <Button
                        type="text"
                        size="small"
                        icon={visibleKeys.has(record.id) ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                        onClick={() => toggleKeyVisibility(record.id)}
                    />
                    <Tooltip title="Sao chép">
                        <Button
                            type="text"
                            size="small"
                            icon={<CopyOutlined />}
                            onClick={() => copyToClipboard(text)}
                        />
                    </Tooltip>
                </Space>
            ),
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'createdAt',
            key: 'createdAt',
            sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        },
        {
            title: 'Lần cuối dùng',
            dataIndex: 'lastUsed',
            key: 'lastUsed',
            render: (text) => text || <Text type="secondary">Chưa dùng</Text>,
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status) => (
                <Tag
                    icon={status === 'active' ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
                    color={status === 'active' ? 'success' : 'default'}
                >
                    {status === 'active' ? 'Hoạt động' : 'Vô hiệu'}
                </Tag>
            ),
            filters: [
                { text: 'Hoạt động', value: 'active' },
                { text: 'Vô hiệu', value: 'inactive' },
            ],
            onFilter: (value, record) => record.status === value,
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_, record) => (
                <Popconfirm
                    title="Xóa API key"
                    description="Bạn có chắc muốn xóa API key này?"
                    onConfirm={() => handleDelete(record.id)}
                    okText="Xóa"
                    cancelText="Hủy"
                    okButtonProps={{ danger: true }}
                >
                    <Button type="link" danger size="small" icon={<DeleteOutlined />}>
                        Xóa
                    </Button>
                </Popconfirm>
            ),
        },
    ];

    const handleCreate = (values: any) => {
        const newKey: ApiKey = {
            id: Date.now().toString(),
            name: values.name,
            key: `pk_${values.environment === 'production' ? 'live' : 'test'}_${Math.random().toString(36).slice(2)}`,
            environment: values.environment,
            createdAt: new Date().toISOString().split('T')[0],
            status: 'active',
            permissions: values.permissions || [],
        };
        setApiKeys([...apiKeys, newKey]);
        message.success('Đã tạo API key mới');
        setModalOpen(false);
        form.resetFields();
    };

    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <Title level={2} style={{ margin: 0 }}>
                        API Keys
                    </Title>
                    <Text type="secondary">Quản lý API keys cho tích hợp bên ngoài</Text>
                </div>
                <Button type="primary" icon={<PlusOutlined />} size="large" onClick={() => setModalOpen(true)}>
                    Tạo API Key
                </Button>
            </div>

            {/* Statistics */}
            <Row gutter={16}>
                <Col xs={24} sm={8}>
                    <Card variant="borderless">
                        <Statistic
                            title="Tổng API Keys"
                            value={apiKeys.length}
                            prefix={<ApiOutlined style={{ color: '#1677ff' }} />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card variant="borderless">
                        <Statistic
                            title="Đang hoạt động"
                            value={apiKeys.filter((k) => k.status === 'active').length}
                            prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card variant="borderless">
                        <Statistic
                            title="Production"
                            value={apiKeys.filter((k) => k.environment === 'production').length}
                            valueStyle={{ color: '#ff4d4f' }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Table */}
            <Card>
                <Table
                    columns={columns}
                    dataSource={apiKeys}
                    rowKey="id"
                    pagination={{
                        pageSize: 10,
                        showTotal: (total) => `Tổng ${total} API keys`,
                    }}
                />
            </Card>

            {/* Create Modal */}
            <Modal
                title="Tạo API Key mới"
                open={modalOpen}
                onCancel={() => {
                    setModalOpen(false);
                    form.resetFields();
                }}
                onOk={() => form.submit()}
                width={600}
            >
                <Form form={form} layout="vertical" onFinish={handleCreate}>
                    <Form.Item
                        label="Tên API Key"
                        name="name"
                        rules={[{ required: true, message: 'Vui lòng nhập tên' }]}
                    >
                        <Input placeholder="Ví dụ: Production API" />
                    </Form.Item>

                    <Form.Item
                        label="Môi trường"
                        name="environment"
                        rules={[{ required: true, message: 'Vui lòng chọn môi trường' }]}
                    >
                        <Select placeholder="Chọn môi trường">
                            <Select.Option value="production">Production</Select.Option>
                            <Select.Option value="development">Development</Select.Option>
                        </Select>
                    </Form.Item>

                    <Form.Item label="Quyền" name="permissions">
                        <Select mode="multiple" placeholder="Chọn quyền">
                            <Select.Option value="read">Read</Select.Option>
                            <Select.Option value="write">Write</Select.Option>
                            <Select.Option value="delete">Delete</Select.Option>
                        </Select>
                    </Form.Item>

                    <Form.Item label="Mô tả" name="description">
                        <TextArea rows={3} placeholder="Mô tả mục đích sử dụng..." />
                    </Form.Item>
                </Form>
            </Modal>
        </Space>
    );
}
