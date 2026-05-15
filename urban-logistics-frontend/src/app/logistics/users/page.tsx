'use client';

import { useState, useEffect } from 'react';
import {
    Card,
    Table,
    Button,
    Space,
    Tag,
    Avatar,
    Input,
    Modal,
    Form,
    Select,
    Switch,
    Row,
    Col,
    Statistic,
    Typography,
    Drawer,
    Descriptions,
    Badge,
} from 'antd';
import {
    UserOutlined,
    PlusOutlined,
    SearchOutlined,
    EditOutlined,
    DeleteOutlined,
    MailOutlined,
    PhoneOutlined,
    TeamOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { userApi } from '@/lib/api';
import { User } from '@/types';

const { Title, Text } = Typography;
const { Search } = Input;

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [form] = Form.useForm();

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await userApi.getAll({ page: 1, limit: 100 });
            setUsers(response.data.data || response.data);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setLoading(false);
        }
    };

    const columns: ColumnsType<User> = [
        {
            title: 'Người dùng',
            dataIndex: 'name',
            key: 'name',
            render: (text, record) => (
                <Space>
                    <Avatar
                        style={{ backgroundColor: '#1677ff' }}
                        icon={<UserOutlined />}
                        src={record.avatarUrl}
                    >
                        {text?.charAt(0)?.toUpperCase()}
                    </Avatar>
                    <div>
                        <div style={{ fontWeight: 500 }}>{text}</div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            {record.email}
                        </Text>
                    </div>
                </Space>
            ),
            sorter: (a, b) => (a.name || '').localeCompare(b.name || ''),
        },
        {
            title: 'Điện thoại',
            dataIndex: 'phone',
            key: 'phone',
            render: (phone) => phone || '—',
        },
        {
            title: 'Vai trò',
            key: 'role',
            render: (_, record) => (
                <Space size={[0, 8]} wrap>
                    {record.memberships?.map((m, i) => (
                        <Tag key={i} color="blue">
                            {m.role?.name || 'N/A'}
                        </Tag>
                    ))}
                </Space>
            ),
        },
        {
            title: 'Tổ chức',
            key: 'org',
            render: (_, record) => (
                <div>
                    {record.memberships?.[0]?.organization?.name || '—'}
                </div>
            ),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'isActive',
            key: 'isActive',
            render: (isActive) =>
                isActive ? (
                    <Badge status="success" text="Hoạt động" />
                ) : (
                    <Badge status="error" text="Ngưng" />
                ),
            filters: [
                { text: 'Hoạt động', value: true },
                { text: 'Ngưng', value: false },
            ],
            onFilter: (value, record) => record.isActive === value,
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_, record) => (
                <Space size="small">
                    <Button
                        type="link"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => {
                            setSelectedUser(record);
                            setDrawerOpen(true);
                        }}
                    >
                        Xem
                    </Button>
                    <Button
                        type="link"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                    >
                        Xóa
                    </Button>
                </Space>
            ),
        },
    ];

    const filteredUsers = users.filter(
        (u) =>
            u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const activeCount = users.filter((u) => u.isActive).length;

    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <Title level={2} style={{ margin: 0 }}>
                        Người dùng & Vai trò
                    </Title>
                    <Text type="secondary">Quản lý nhân viên và phân quyền hệ thống</Text>
                </div>
                <Button type="primary" icon={<PlusOutlined />} size="large" onClick={() => setModalOpen(true)}>
                    Thêm người dùng
                </Button>
            </div>

            {/* Statistics */}
            <Row gutter={16}>
                <Col xs={24} sm={8}>
                    <Card variant="borderless">
                        <Statistic
                            title="Tổng nhân viên"
                            value={users.length}
                            prefix={<TeamOutlined style={{ color: '#1677ff' }} />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card variant="borderless">
                        <Statistic
                            title="Đang hoạt động"
                            value={activeCount}
                            prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card variant="borderless">
                        <Statistic
                            title="Ngưng hoạt động"
                            value={users.length - activeCount}
                            prefix={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
                            valueStyle={{ color: '#ff4d4f' }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Table */}
            <Card>
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <Search
                        placeholder="Tìm kiếm theo tên hoặc email..."
                        allowClear
                        enterButton={<SearchOutlined />}
                        size="large"
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ maxWidth: 500 }}
                    />
                    <Table
                        columns={columns}
                        dataSource={filteredUsers}
                        loading={loading}
                        rowKey="id"
                        pagination={{
                            pageSize: 10,
                            showSizeChanger: true,
                            showTotal: (total) => `Tổng ${total} người dùng`,
                        }}
                    />
                </Space>
            </Card>

            {/* User Detail Drawer */}
            <Drawer
                title="Thông tin người dùng"
                placement="right"
                width={500}
                onClose={() => setDrawerOpen(false)}
                open={drawerOpen}
            >
                {selectedUser && (
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                        <div style={{ textAlign: 'center' }}>
                            <Avatar
                                size={80}
                                style={{ backgroundColor: '#1677ff' }}
                                icon={<UserOutlined />}
                                src={selectedUser.avatarUrl}
                            >
                                {selectedUser.name?.charAt(0)?.toUpperCase()}
                            </Avatar>
                            <Title level={4} style={{ marginTop: 16, marginBottom: 4 }}>
                                {selectedUser.name}
                            </Title>
                            <Tag color={selectedUser.isActive ? 'success' : 'error'}>
                                {selectedUser.isActive ? 'Hoạt động' : 'Ngưng'}
                            </Tag>
                        </div>

                        <Descriptions column={1} bordered>
                            <Descriptions.Item label={<><MailOutlined /> Email</>}>
                                {selectedUser.email}
                            </Descriptions.Item>
                            <Descriptions.Item label={<><PhoneOutlined /> Điện thoại</>}>
                                {selectedUser.phone || '—'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Vai trò">
                                <Space size={[0, 8]} wrap>
                                    {selectedUser.memberships?.map((m, i) => (
                                        <Tag key={i} color="blue">
                                            {m.role?.name || 'N/A'}
                                        </Tag>
                                    ))}
                                </Space>
                            </Descriptions.Item>
                            <Descriptions.Item label="Tổ chức">
                                {selectedUser.memberships?.[0]?.organization?.name || '—'}
                            </Descriptions.Item>
                        </Descriptions>

                        <Space>
                            <Button type="primary" icon={<EditOutlined />}>
                                Chỉnh sửa
                            </Button>
                            <Button danger icon={<DeleteOutlined />}>
                                Xóa người dùng
                            </Button>
                        </Space>
                    </Space>
                )}
            </Drawer>

            {/* Add User Modal */}
            <Modal
                title="Thêm người dùng mới"
                open={modalOpen}
                onCancel={() => {
                    setModalOpen(false);
                    form.resetFields();
                }}
                onOk={() => form.submit()}
                width={600}
            >
                <Form form={form} layout="vertical" onFinish={(values) => console.log(values)}>
                    <Form.Item
                        label="Họ tên"
                        name="name"
                        rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
                    >
                        <Input prefix={<UserOutlined />} placeholder="Nhập họ tên" />
                    </Form.Item>

                    <Form.Item
                        label="Email"
                        name="email"
                        rules={[
                            { required: true, message: 'Vui lòng nhập email' },
                            { type: 'email', message: 'Email không hợp lệ' },
                        ]}
                    >
                        <Input prefix={<MailOutlined />} placeholder="email@example.com" />
                    </Form.Item>

                    <Form.Item label="Điện thoại" name="phone">
                        <Input prefix={<PhoneOutlined />} placeholder="0987654321" />
                    </Form.Item>

                    <Form.Item label="Vai trò" name="role" rules={[{ required: true }]}>
                        <Select placeholder="Chọn vai trò">
                            <Select.Option value="admin">Admin</Select.Option>
                            <Select.Option value="manager">Manager</Select.Option>
                            <Select.Option value="staff">Staff</Select.Option>
                        </Select>
                    </Form.Item>

                    <Form.Item label="Trạng thái" name="isActive" valuePropName="checked" initialValue={true}>
                        <Switch checkedChildren="Hoạt động" unCheckedChildren="Ngưng" />
                    </Form.Item>
                </Form>
            </Modal>
        </Space>
    );
}
