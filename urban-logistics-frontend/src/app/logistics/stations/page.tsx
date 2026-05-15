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
    InputNumber,
    Badge,
    Tooltip,
} from 'antd';
import {
    HomeOutlined,
    PlusOutlined,
    SearchOutlined,
    EnvironmentOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    EditOutlined,
    DeleteOutlined,
    ShopOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;
const { Search } = Input;

interface Station {
    id: string;
    name: string;
    address: string;
    type: string;
    capacity: number;
    status: 'active' | 'inactive';
}

export default function StationsPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [form] = Form.useForm();
    const [stations] = useState<Station[]>([
        {
            id: '1',
            name: 'Trạm Trung tâm Quận 1',
            address: '123 Nguyễn Huệ, Q1, TP.HCM',
            type: 'Hub',
            capacity: 500,
            status: 'active',
        },
        {
            id: '2',
            name: 'Trạm Gò Vấp',
            address: '456 Quang Trung, Gò Vấp, TP.HCM',
            type: 'Distribution Center',
            capacity: 300,
            status: 'active',
        },
        {
            id: '3',
            name: 'Trạm Bình Thạnh',
            address: '789 Điện Biên Phủ, Bình Thạnh, TP.HCM',
            type: 'Hub',
            capacity: 400,
            status: 'inactive',
        },
    ]);

    const columns: ColumnsType<Station> = [
        {
            title: 'Tên trạm',
            dataIndex: 'name',
            key: 'name',
            render: (text, record) => (
                <div>
                    <div style={{ fontWeight: 500 }}>{text}</div>
                    <Tag color={record.type === 'Hub' ? 'blue' : 'purple'}>
                        {record.type}
                    </Tag>
                </div>
            ),
            sorter: (a, b) => a.name.localeCompare(b.name),
        },
        {
            title: 'Địa chỉ',
            dataIndex: 'address',
            key: 'address',
            render: (text) => (
                <Space>
                    <EnvironmentOutlined style={{ color: '#1677ff' }} />
                    <Text>{text}</Text>
                </Space>
            ),
        },
        {
            title: 'Công suất',
            dataIndex: 'capacity',
            key: 'capacity',
            render: (capacity) => (
                <Text strong style={{ color: '#faad14' }}>
                    {capacity} đơn/ngày
                </Text>
            ),
            sorter: (a, b) => a.capacity - b.capacity,
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status) =>
                status === 'active' ? (
                    <Badge status="success" text="Hoạt động" />
                ) : (
                    <Badge status="error" text="Ngưng" />
                ),
            filters: [
                { text: 'Hoạt động', value: 'active' },
                { text: 'Ngưng', value: 'inactive' },
            ],
            onFilter: (value, record) => record.status === value,
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

    const filteredStations = stations.filter(
        (s) =>
            s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.address.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalCapacity = stations.reduce((sum, s) => sum + s.capacity, 0);
    const activeStations = stations.filter((s) => s.status === 'active').length;

    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <Title level={2} style={{ margin: 0 }}>
                        Quản lý Trạm
                    </Title>
                    <Text type="secondary">Danh sách các trạm logistics</Text>
                </div>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    size="large"
                    onClick={() => setModalOpen(true)}
                >
                    Thêm trạm
                </Button>
            </div>

            {/* Statistics */}
            <Row gutter={16}>
                <Col xs={24} sm={8}>
                    <Card variant="borderless">
                        <Statistic
                            title="Tổng trạm"
                            value={stations.length}
                            prefix={<HomeOutlined style={{ color: '#1677ff' }} />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card variant="borderless">
                        <Statistic
                            title="Đang hoạt động"
                            value={activeStations}
                            prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card variant="borderless">
                        <Statistic
                            title="Tổng công suất"
                            value={totalCapacity}
                            suffix="đơn/ngày"
                            prefix={<ShopOutlined style={{ color: '#faad14' }} />}
                            valueStyle={{ color: '#faad14' }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Table */}
            <Card>
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <Search
                        placeholder="Tìm tên trạm, địa chỉ..."
                        allowClear
                        enterButton={<SearchOutlined />}
                        size="large"
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ maxWidth: 500 }}
                    />
                    <Table
                        columns={columns}
                        dataSource={filteredStations}
                        rowKey="id"
                        pagination={{
                            pageSize: 10,
                            showTotal: (total) => `Tổng ${total} trạm`,
                        }}
                    />
                </Space>
            </Card>

            {/* Create Modal */}
            <Modal
                title="Thêm trạm mới"
                open={modalOpen}
                onCancel={() => {
                    setModalOpen(false);
                    form.resetFields();
                }}
                onOk={() => form.submit()}
                width={600}
            >
                <Form form={form} layout="vertical" onFinish={() => console.log('Create station')}>
                    <Form.Item
                        label="Tên trạm"
                        name="name"
                        rules={[{ required: true, message: 'Vui lòng nhập tên trạm' }]}
                    >
                        <Input prefix={<HomeOutlined />} placeholder="Ví dụ: Trạm Quận 1" />
                    </Form.Item>

                    <Form.Item
                        label="Địa chỉ"
                        name="address"
                        rules={[{ required: true, message: 'Vui lòng nhập địa chỉ' }]}
                    >
                        <Input prefix={<EnvironmentOutlined />} placeholder="Nhập địa chỉ đầy đủ" />
                    </Form.Item>

                    <Form.Item
                        label="Loại trạm"
                        name="type"
                        rules={[{ required: true, message: 'Vui lòng chọn loại trạm' }]}
                    >
                        <Select placeholder="Chọn loại trạm">
                            <Select.Option value="Hub">Hub - Trung tâm</Select.Option>
                            <Select.Option value="Distribution Center">Distribution Center - Trung tâm phân phối</Select.Option>
                            <Select.Option value="Warehouse">Warehouse - Kho hàng</Select.Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        label="Công suất (đơn/ngày)"
                        name="capacity"
                        rules={[{ required: true, message: 'Vui lòng nhập công suất' }]}
                    >
                        <InputNumber min={1} style={{ width: '100%' }} placeholder="Ví dụ: 500" />
                    </Form.Item>
                </Form>
            </Modal>
        </Space>
    );
}
