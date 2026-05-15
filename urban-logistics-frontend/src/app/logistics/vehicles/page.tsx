'use client';

import { useState, useEffect } from 'react';
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
    message,
    Tooltip,
    Badge,
    Progress,
    Segmented,
    Drawer,
    Descriptions,
} from 'antd';
import {
    CarOutlined,
    PlusOutlined,
    SearchOutlined,
    EditOutlined,
    DeleteOutlined,
    ThunderboltOutlined,
    FireOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    ToolOutlined,
    DashboardOutlined,
    EnvironmentOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { vehicleApi, carrierApi } from '@/lib/api';
import { Vehicle, Carrier } from '@/types';

const { Title, Text } = Typography;
const { Search } = Input;

const vehicleTypeOptions = [
    { value: 'motorcycle', label: 'Xe máy', icon: '🏍️', capacity: '10-30kg' },
    { value: 'electric_bike', label: 'Xe điện', icon: '⚡', capacity: '15-40kg' },
    { value: 'van', label: 'Xe van', icon: '🚐', capacity: '200-500kg' },
    { value: 'small_truck', label: 'Xe tải nhỏ', icon: '🚚', capacity: '500-1000kg' },
    { value: 'large_truck', label: 'Xe tải lớn', icon: '🚛', capacity: '1000-5000kg' },
];

const statusConfig = {
    available: { color: 'success', text: 'Sẵn sàng', icon: <CheckCircleOutlined /> },
    in_use: { color: 'processing', text: 'Đang chạy', icon: <DashboardOutlined /> },
    maintenance: { color: 'warning', text: 'Bảo trì', icon: <ToolOutlined /> },
    offline: { color: 'default', text: 'Offline', icon: <ClockCircleOutlined /> },
};

export default function LogisticsVehiclesPage() {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [carriers, setCarriers] = useState<Carrier[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
    const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
    const [form] = Form.useForm();

    const fetchCarriers = async () => {
        try {
            const response = await carrierApi.getAll({ limit: 100 });
            setCarriers(response.data.data || response.data);
        } catch (error) {
            console.error('Failed to fetch carriers:', error);
        }
    };

    const fetchVehicles = async () => {
        setLoading(true);
        try {
            const params: Record<string, unknown> = { page, limit: 10 };
            if (typeFilter !== 'all') params.type = typeFilter;
            const response = await vehicleApi.getAll(params);
            setVehicles(response.data.data || response.data);
            setTotalPages(response.data.meta?.totalPages || 1);
        } catch (error) {
            console.error('Failed to fetch vehicles:', error);
            message.error('Không thể tải danh sách xe');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCarriers();
    }, []);

    useEffect(() => {
        fetchVehicles();
    }, [page, typeFilter]);

    const handleSubmit = async (values: any) => {
        try {
            const data = {
                ...values,
                isElectric: values.fuelType === 'electric',
            };

            if (editingVehicle) {
                await vehicleApi.update(editingVehicle.id, data);
                message.success('Đã cập nhật xe');
            } else {
                await vehicleApi.create(data);
                message.success('Đã thêm xe mới');
            }
            setIsModalOpen(false);
            setEditingVehicle(null);
            form.resetFields();
            fetchVehicles();
        } catch (error) {
            console.error('Failed to save vehicle:', error);
            message.error('Có lỗi xảy ra khi lưu thông tin xe');
        }
    };

    const handleEdit = (vehicle: Vehicle) => {
        setEditingVehicle(vehicle);
        form.setFieldsValue({
            carrierId: vehicle.carrierId,
            type: vehicle.type,
            plate: vehicle.plate,
            brand: vehicle.brand,
            model: vehicle.model,
            capacity: vehicle.capacity,
            volume: vehicle.volume,
            fuelType: vehicle.fuelType,
            emissionStandard: vehicle.emissionStandard,
            range: vehicle.range,
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        try {
            await vehicleApi.delete(id);
            message.success('Đã xóa xe');
            fetchVehicles();
        } catch (error) {
            console.error('Failed to delete vehicle:', error);
            message.error('Không thể xóa xe');
        }
    };

    const columns: ColumnsType<Vehicle> = [
        {
            title: 'Biển số',
            dataIndex: 'plate',
            key: 'plate',
            render: (text, record) => (
                <Space direction="vertical" size="small">
                    <Text strong style={{ fontSize: 16, fontFamily: 'monospace' }}>{text}</Text>
                    <Space>
                        {record.isElectric ? (
                            <Tag icon={<ThunderboltOutlined />} color="green">Điện</Tag>
                        ) : (
                            <Tag icon={<FireOutlined />} color="orange">Xăng/Dầu</Tag>
                        )}
                    </Space>
                </Space>
            ),
        },
        {
            title: 'Loại xe',
            dataIndex: 'type',
            key: 'type',
            render: (type) => {
                const typeOpt = vehicleTypeOptions.find(t => t.value === type);
                return (
                    <Space>
                        <span style={{ fontSize: 20 }}>{typeOpt?.icon}</span>
                        <div>
                            <div>{typeOpt?.label || type}</div>
                            <Text type="secondary" style={{ fontSize: 12 }}>{typeOpt?.capacity}</Text>
                        </div>
                    </Space>
                );
            },
        },
        {
            title: 'Thông tin',
            key: 'info',
            render: (_, record) => (
                <div>
                    <div><Text strong>{record.brand} {record.model}</Text></div>
                    {record.carrier && (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            {record.carrier.name}
                        </Text>
                    )}
                </div>
            ),
        },
        {
            title: 'Thông số',
            key: 'specs',
            render: (_, record) => (
                <Space direction="vertical" size="small">
                    {record.capacity && (
                        <Text>
                            <strong>Tải:</strong> {record.capacity} kg
                        </Text>
                    )}
                    {record.volume && (
                        <Text>
                            <strong>Thể tích:</strong> {record.volume} m³
                        </Text>
                    )}
                    {record.range && (
                        <Tag icon={<EnvironmentOutlined />} color="blue">
                            {record.range} km
                        </Tag>
                    )}
                </Space>
            ),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.offline;
                return (
                    <Tag color={config.color} icon={config.icon}>
                        {config.text}
                    </Tag>
                );
            },
            filters: Object.entries(statusConfig).map(([value, config]) => ({
                text: config.text,
                value,
            })),
            onFilter: (value, record) => record.status === value,
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title="Chi tiết">
                        <Button
                            type="link"
                            size="small"
                            onClick={() => {
                                setSelectedVehicle(record);
                                setDetailDrawerOpen(true);
                            }}
                        >
                            Xem
                        </Button>
                    </Tooltip>
                    <Tooltip title="Chỉnh sửa">
                        <Button
                            type="link"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => handleEdit(record)}
                        />
                    </Tooltip>
                    <Tooltip title="Xóa">
                        <Button
                            type="link"
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => {
                                Modal.confirm({
                                    title: 'Xóa xe',
                                    content: `Bạn có chắc muốn xóa xe "${record.plate}"?`,
                                    okText: 'Xóa',
                                    cancelText: 'Hủy',
                                    okButtonProps: { danger: true },
                                    onOk: () => handleDelete(record.id),
                                });
                            }}
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    const filteredVehicles = vehicles.filter((v) =>
        v.plate.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.model?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const vehiclesByStatus = {
        available: vehicles.filter(v => v.status === 'available').length,
        in_use: vehicles.filter(v => v.status === 'in_use').length,
        maintenance: vehicles.filter(v => v.status === 'maintenance').length,
    };

    const electricCount = vehicles.filter(v => v.isElectric).length;
    const utilizationRate = vehicles.length > 0
        ? Math.round((vehiclesByStatus.in_use / vehicles.length) * 100)
        : 0;

    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <Title level={2} style={{ margin: 0 }}>
                        <CarOutlined /> Quản lý đội xe
                    </Title>
                    <Text type="secondary">
                        Fleet management - Theo dõi và điều phối phương tiện
                    </Text>
                </div>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    size="large"
                    onClick={() => {
                        form.resetFields();
                        setEditingVehicle(null);
                        setIsModalOpen(true);
                    }}
                >
                    Thêm xe
                </Button>
            </div>

            {/* Statistics */}
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={6}>
                    <Card variant="borderless">
                        <Statistic
                            title="Tổng số xe"
                            value={vehicles.length}
                            prefix={<CarOutlined style={{ color: '#1677ff' }} />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card variant="borderless">
                        <Statistic
                            title="Sẵn sàng"
                            value={vehiclesByStatus.available}
                            prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card variant="borderless">
                        <Statistic
                            title="Đang hoạt động"
                            value={vehiclesByStatus.in_use}
                            prefix={<DashboardOutlined style={{ color: '#1677ff' }} />}
                            suffix={
                                <Text type="secondary" style={{ fontSize: 14 }}>
                                    ({utilizationRate}%)
                                </Text>
                            }
                        />
                        <Progress
                            percent={utilizationRate}
                            strokeColor="#1677ff"
                            style={{ marginTop: 8 }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card variant="borderless">
                        <Statistic
                            title="Xe điện"
                            value={electricCount}
                            prefix={<ThunderboltOutlined style={{ color: '#52c41a' }} />}
                            valueStyle={{ color: '#52c41a' }}
                            suffix={
                                <Text type="secondary" style={{ fontSize: 14 }}>
                                    /{vehicles.length}
                                </Text>
                            }
                        />
                    </Card>
                </Col>
            </Row>

            {/* Filters */}
            <Card>
                <Row gutter={16} align="middle">
                    <Col flex="auto">
                        <Search
                            placeholder="Tìm biển số, hãng xe, model..."
                            allowClear
                            enterButton={<SearchOutlined />}
                            size="large"
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </Col>
                    <Col>
                        <Segmented
                            options={[
                                { label: 'Tất cả', value: 'all' },
                                ...vehicleTypeOptions.map(t => ({
                                    label: `${t.icon} ${t.label}`,
                                    value: t.value
                                })),
                            ]}
                            value={typeFilter}
                            onChange={(value) => {
                                setTypeFilter(value as string);
                                setPage(1);
                            }}
                        />
                    </Col>
                </Row>
            </Card>

            {/* Table */}
            <Card title={`Danh sách xe (${filteredVehicles.length})`}>
                <Table
                    columns={columns}
                    dataSource={filteredVehicles}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        current: page,
                        pageSize: 10,
                        total: totalPages * 10,
                        onChange: setPage,
                        showTotal: (total) => `Tổng ${total} xe`,
                    }}
                />
            </Card>

            {/* Create/Edit Modal */}
            <Modal
                title={editingVehicle ? 'Chỉnh sửa xe' : 'Thêm xe mới'}
                open={isModalOpen}
                onCancel={() => {
                    setIsModalOpen(false);
                    setEditingVehicle(null);
                    form.resetFields();
                }}
                onOk={() => form.submit()}
                width={700}
                okText={editingVehicle ? 'Cập nhật' : 'Thêm xe'}
                cancelText="Hủy"
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                    <Form.Item
                        label="Đơn vị vận tải"
                        name="carrierId"
                        rules={[{ required: true, message: 'Vui lòng chọn đơn vị vận tải' }]}
                    >
                        <Select placeholder="Chọn carrier" size="large">
                            {carriers.map(c => (
                                <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                label="Biển số"
                                name="plate"
                                rules={[{ required: true, message: 'Vui lòng nhập biển số' }]}
                            >
                                <Input size="large" placeholder="51A-12345" style={{ fontFamily: 'monospace' }} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                label="Loại xe"
                                name="type"
                                rules={[{ required: true }]}
                            >
                                <Select size="large">
                                    {vehicleTypeOptions.map(t => (
                                        <Select.Option key={t.value} value={t.value}>
                                            {t.icon} {t.label}
                                        </Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item label="Hãng xe" name="brand">
                                <Input size="large" placeholder="Honda, Hyundai..." />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="Model" name="model">
                                <Input size="large" placeholder="City, Porter..." />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item label="Tải trọng (kg)" name="capacity">
                                <InputNumber style={{ width: '100%' }} min={0} placeholder="500" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="Thể tích (m³)" name="volume">
                                <InputNumber style={{ width: '100%' }} min={0} step={0.1} placeholder="2.5" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="Phạm vi (km)" name="range">
                                <InputNumber style={{ width: '100%' }} min={0} placeholder="150" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                label="Nhiên liệu"
                                name="fuelType"
                                rules={[{ required: true }]}
                            >
                                <Select size="large">
                                    <Select.Option value="gasoline">
                                        <Space><FireOutlined /> Xăng</Space>
                                    </Select.Option>
                                    <Select.Option value="diesel">
                                        <Space><FireOutlined /> Dầu diesel</Space>
                                    </Select.Option>
                                    <Select.Option value="electric">
                                        <Space><ThunderboltOutlined /> Điện</Space>
                                    </Select.Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="Tiêu chuẩn khí thải" name="emissionStandard">
                                <Input size="large" placeholder="Euro 4, Euro 5..." />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>

            {/* Detail Drawer */}
            <Drawer
                title="Chi tiết xe"
                placement="right"
                width={500}
                onClose={() => setDetailDrawerOpen(false)}
                open={detailDrawerOpen}
            >
                {selectedVehicle && (
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 48, marginBottom: 16 }}>
                                {vehicleTypeOptions.find(t => t.value === selectedVehicle.type)?.icon || '🚗'}
                            </div>
                            <Title level={3} style={{ margin: 0, fontFamily: 'monospace' }}>
                                {selectedVehicle.plate}
                            </Title>
                            <Space style={{ marginTop: 8 }}>
                                {statusConfig[selectedVehicle.status as keyof typeof statusConfig] && (
                                    <Tag
                                        color={statusConfig[selectedVehicle.status as keyof typeof statusConfig].color}
                                        icon={statusConfig[selectedVehicle.status as keyof typeof statusConfig].icon}
                                    >
                                        {statusConfig[selectedVehicle.status as keyof typeof statusConfig].text}
                                    </Tag>
                                )}
                                {selectedVehicle.isElectric && (
                                    <Tag icon={<ThunderboltOutlined />} color="green">Xe điện</Tag>
                                )}
                            </Space>
                        </div>

                        <Descriptions column={1} bordered>
                            <Descriptions.Item label="Loại xe">
                                {vehicleTypeOptions.find(t => t.value === selectedVehicle.type)?.label}
                            </Descriptions.Item>
                            <Descriptions.Item label="Hãng - Model">
                                {selectedVehicle.brand} {selectedVehicle.model}
                            </Descriptions.Item>
                            <Descriptions.Item label="Đơn vị vận tải">
                                {selectedVehicle.carrier?.name || '—'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Tải trọng">
                                {selectedVehicle.capacity ? `${selectedVehicle.capacity} kg` : '—'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Thể tích">
                                {selectedVehicle.volume ? `${selectedVehicle.volume} m³` : '—'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Nhiên liệu">
                                {selectedVehicle.fuelType === 'electric' ? '⚡ Điện' :
                                    selectedVehicle.fuelType === 'diesel' ? '🔥 Dầu diesel' : '🔥 Xăng'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Phạm vi">
                                {selectedVehicle.range ? `${selectedVehicle.range} km` : '—'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Tiêu chuẩn khí thải">
                                {selectedVehicle.emissionStandard || '—'}
                            </Descriptions.Item>
                        </Descriptions>

                        <Space>
                            <Button type="primary" icon={<EditOutlined />} onClick={() => {
                                setDetailDrawerOpen(false);
                                handleEdit(selectedVehicle);
                            }}>
                                Chỉnh sửa
                            </Button>
                            <Button danger icon={<DeleteOutlined />} onClick={() => {
                                Modal.confirm({
                                    title: 'Xóa xe',
                                    content: `Bạn có chắc muốn xóa xe "${selectedVehicle.plate}"?`,
                                    okText: 'Xóa',
                                    cancelText: 'Hủy',
                                    okButtonProps: { danger: true },
                                    onOk: () => {
                                        handleDelete(selectedVehicle.id);
                                        setDetailDrawerOpen(false);
                                    },
                                });
                            }}>
                                Xóa xe
                            </Button>
                        </Space>
                    </Space>
                )}
            </Drawer>
        </Space>
    );
}
