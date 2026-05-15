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
    TimePicker,
    InputNumber,
    message,
    Tooltip,
    Segmented,
    Badge,
    Descriptions,
    Drawer,
} from 'antd';
import {
    ShopOutlined,
    PlusOutlined,
    SearchOutlined,
    EnvironmentOutlined,
    ThunderboltOutlined,
    FireOutlined,
    HomeOutlined,
    InboxOutlined,
    EditOutlined,
    DeleteOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    AimOutlined,
    FilterOutlined,
    ClockCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { facilityApi, zoneApi, organizationApi } from '@/lib/api';
import { Facility, Zone, Organization } from '@/types';
import FacilityMapPicker from '@/components/logistics/facility-map-picker';
import { useAuthStore } from '@/stores/auth-store';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Search } = Input;

const kindOptions = [
    { value: 'hub', label: 'Hub giao nhận', icon: <HomeOutlined />, color: '#1677ff' },
    { value: 'warehouse', label: 'Kho bãi', icon: <InboxOutlined />, color: '#722ed1' },
    { value: 'charging_station', label: 'Trạm sạc', icon: <ThunderboltOutlined />, color: '#52c41a' },
    { value: 'fuel_station', label: 'Trạm xăng', icon: <FireOutlined />, color: '#faad14' },
    { value: 'pickup_point', label: 'Điểm giao nhận', icon: <EnvironmentOutlined />, color: '#13c2c2' },
];

export default function LogisticsFacilitiesPage() {
    const user = useAuthStore((s) => s.user);
    const [facilities, setFacilities] = useState<Facility[]>([]);
    const [zones, setZones] = useState<Zone[]>([]);
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [kindFilter, setKindFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
    const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
    const [editingFacility, setEditingFacility] = useState<Facility | null>(null);
    const [pickOnMap, setPickOnMap] = useState(false);
    const [form] = Form.useForm();
    const [formData, setFormData] = useState({
        organizationId: '',
        name: '',
        kind: 'hub',
        address: '',
        latitude: '',
        longitude: '',
        capacity: '',
        openingTime: '',
        closingTime: '',
        zoneId: '',
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [facilitiesRes, zonesRes, orgRes] = await Promise.all([
                facilityApi.getAll({
                    page,
                    limit: 10,
                    kind: kindFilter !== 'all' ? kindFilter : undefined
                }),
                zoneApi.getAll({ limit: 50 }),
                organizationApi.getAll({ limit: 100 }),
            ]);
            setFacilities(facilitiesRes.data.data || facilitiesRes.data);
            setZones(zonesRes.data.data || zonesRes.data);
            const orgPayload = orgRes.data as { data?: Organization[] };
            setOrganizations(orgPayload.data || []);
            setTotalPages(facilitiesRes.data.meta?.totalPages || 1);
        } catch (error) {
            console.error('Failed to fetch data:', error);
            message.error('Không thể tải dữ liệu cơ sở');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [page, kindFilter]);

    const handleSubmit = async (values: any) => {
        try {
            const data = {
                ...values,
                latitude: Number(values.latitude) || 0,
                longitude: Number(values.longitude) || 0,
                capacity: values.capacity ? Number(values.capacity) : undefined,
                openingTime: values.openingTime ? dayjs(values.openingTime).format('HH:mm') : undefined,
                closingTime: values.closingTime ? dayjs(values.closingTime).format('HH:mm') : undefined,
            };

            if (editingFacility) {
                const { organizationId: _o, ...patch } = data;
                await facilityApi.update(editingFacility.id, patch);
                message.success('Đã cập nhật cơ sở');
            } else {
                await facilityApi.create(data);
                message.success('Đã tạo cơ sở mới');
            }
            setIsModalOpen(false);
            setEditingFacility(null);
            form.resetFields();
            fetchData();
        } catch (error) {
            console.error('Failed to save facility:', error);
            message.error('Có lỗi xảy ra khi lưu cơ sở');
        }
    };

    const handleEdit = (facility: Facility) => {
        setEditingFacility(facility);
        setPickOnMap(false);
        form.setFieldsValue({
            organizationId: facility.organizationId,
            name: facility.name,
            kind: facility.kind,
            address: facility.address || '',
            latitude: facility.latitude || '',
            longitude: facility.longitude || '',
            capacity: facility.capacity || '',
            openingTime: facility.openingTime ? dayjs(facility.openingTime, 'HH:mm') : null,
            closingTime: facility.closingTime ? dayjs(facility.closingTime, 'HH:mm') : null,
            zoneId: facility.zoneId || '',
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        try {
            await facilityApi.delete(id);
            message.success('Đã xóa cơ sở');
            fetchData();
        } catch (error) {
            console.error('Failed to delete facility:', error);
            message.error('Không thể xóa cơ sở');
        }
    };

    const handleViewDetail = (facility: Facility) => {
        setSelectedFacility(facility);
        setDetailDrawerOpen(true);
    };

    const columns: ColumnsType<Facility> = [
        {
            title: 'Tên cơ sở',
            dataIndex: 'name',
            key: 'name',
            render: (text, record) => {
                const kindOpt = kindOptions.find(k => k.value === record.kind);
                return (
                    <div>
                        <Space>
                            <span style={{ color: kindOpt?.color }}>{kindOpt?.icon}</span>
                            <Text strong>{text}</Text>
                        </Space>
                        <div style={{ marginTop: 4 }}>
                            <Tag color={kindOpt?.color}>{kindOpt?.label}</Tag>
                        </div>
                    </div>
                );
            },
            sorter: (a, b) => a.name.localeCompare(b.name),
        },
        {
            title: 'Địa chỉ',
            dataIndex: 'address',
            key: 'address',
            render: (text) => (
                <Space>
                    <EnvironmentOutlined style={{ color: '#1677ff' }} />
                    <Text ellipsis style={{ maxWidth: 300 }}>{text || '—'}</Text>
                </Space>
            ),
        },
        {
            title: 'Sức chứa',
            dataIndex: 'capacity',
            key: 'capacity',
            render: (capacity) => capacity ? <Text strong>{capacity}</Text> : '—',
            sorter: (a, b) => (a.capacity || 0) - (b.capacity || 0),
        },
        {
            title: 'Giờ hoạt động',
            key: 'hours',
            render: (_, record) => {
                if (record.openingTime && record.closingTime) {
                    return (
                        <Space>
                            <ClockCircleOutlined />
                            <Text>{record.openingTime} - {record.closingTime}</Text>
                        </Space>
                    );
                }
                return '24/7';
            },
        },
        {
            title: 'Trạng thái',
            dataIndex: 'isActive',
            key: 'isActive',
            render: (isActive) =>
                isActive ? (
                    <Badge status="success" text="Hoạt động" />
                ) : (
                    <Badge status="error" text="Đóng cửa" />
                ),
            filters: [
                { text: 'Hoạt động', value: true },
                { text: 'Đóng cửa', value: false },
            ],
            onFilter: (value, record) => record.isActive === value,
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title="Xem chi tiết">
                        <Button
                            type="link"
                            size="small"
                            icon={<EnvironmentOutlined />}
                            onClick={() => handleViewDetail(record)}
                        >
                            Chi tiết
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
                                    title: 'Xóa cơ sở',
                                    content: `Bạn có chắc muốn xóa "${record.name}"?`,
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

    const filteredFacilities = facilities.filter((f) =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.address?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const facilityStats = kindOptions.map(kind => ({
        ...kind,
        count: facilities.filter(f => f.kind === kind.value).length,
    }));

    const totalCapacity = facilities.reduce((sum, f) => sum + (f.capacity || 0), 0);
    const activeCount = facilities.filter(f => f.isActive).length;

    return (
        <Space orientation="vertical" size="large" style={{ width: '100%' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <Title level={2} style={{ margin: 0 }}>
                        <ShopOutlined /> Quản lý cơ sở logistics
                    </Title>
                    <Text type="secondary">
                        Hub giao nhận, kho bãi, trạm sạc và điểm phục vụ
                    </Text>
                </div>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    size="large"
                    onClick={() => {
                        form.resetFields();
                        setEditingFacility(null);
                        setPickOnMap(false);
                        setIsModalOpen(true);
                    }}
                >
                    Thêm cơ sở
                </Button>
            </div>

            {/* Statistics */}
            <Row gutter={[16, 16]}>
                {facilityStats.map((stat) => (
                    <Col xs={24} sm={12} md={8} lg={4} key={stat.value}>
                        <Card variant="borderless" hoverable>
                            <Statistic
                                title={stat.label}
                                value={stat.count}
                                prefix={
                                    <span style={{ color: stat.color, fontSize: 24 }}>
                                        {stat.icon}
                                    </span>
                                }
                                styles={{ content: { color: stat.color } }}
                            />
                        </Card>
                    </Col>
                ))}
                <Col xs={24} sm={12} md={8} lg={4}>
                    <Card variant="borderless" hoverable>
                        <Statistic
                            title="Đang hoạt động"
                            value={activeCount}
                            prefix={<CheckCircleOutlined style={{ color: '#52c41a', fontSize: 24 }} />}
                            styles={{ content: { color: '#52c41a' } }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={8} lg={4}>
                    <Card variant="borderless" hoverable>
                        <Statistic
                            title="Tổng sức chứa"
                            value={totalCapacity}
                            prefix={<InboxOutlined style={{ color: '#faad14', fontSize: 24 }} />}
                            styles={{ content: { color: '#faad14' } }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Filters */}
            <Card>
                <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
                    <Row gutter={16} align="middle">
                        <Col flex="auto">
                            <Search
                                placeholder="Tìm tên cơ sở, địa chỉ..."
                                allowClear
                                enterButton={<SearchOutlined />}
                                size="large"
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </Col>
                        <Col>
                            <Space>
                                <FilterOutlined />
                                <Segmented
                                    options={[
                                        { label: 'Tất cả', value: 'all' },
                                        ...kindOptions.map(k => ({ label: k.label, value: k.value })),
                                    ]}
                                    value={kindFilter}
                                    onChange={(value) => {
                                        setKindFilter(value as string);
                                        setPage(1);
                                    }}
                                />
                            </Space>
                        </Col>
                    </Row>
                </Space>
            </Card>

            {/* Table */}
            <Card title={`Danh sách cơ sở (${filteredFacilities.length})`}>
                <Table
                    columns={columns}
                    dataSource={filteredFacilities}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        current: page,
                        pageSize: 10,
                        total: totalPages * 10,
                        onChange: setPage,
                        showTotal: (total) => `Tổng ${total} cơ sở`,
                        showSizeChanger: false,
                    }}
                />
            </Card>

            {/* Create/Edit Modal */}
            <Modal
                title={editingFacility ? 'Chỉnh sửa cơ sở' : 'Thêm cơ sở mới'}
                open={isModalOpen}
                onCancel={() => {
                    setIsModalOpen(false);
                    setEditingFacility(null);
                    form.resetFields();
                }}
                onOk={() => form.submit()}
                width={800}
                okText={editingFacility ? 'Cập nhật' : 'Tạo cơ sở'}
                cancelText="Hủy"
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                    {!editingFacility && (
                        <Form.Item
                            label="Tổ chức"
                            name="organizationId"
                            rules={[{ required: true, message: 'Vui lòng chọn tổ chức' }]}
                        >
                            <Select placeholder="Chọn tổ chức" size="large">
                                {organizations.map(org => (
                                    <Select.Option key={org.id} value={org.id}>
                                        {org.name}
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                    )}

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                label="Tên cơ sở"
                                name="name"
                                rules={[{ required: true, message: 'Vui lòng nhập tên' }]}
                            >
                                <Input size="large" placeholder="Ví dụ: Hub Quận 1" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                label="Loại cơ sở"
                                name="kind"
                                rules={[{ required: true }]}
                            >
                                <Select size="large">
                                    {kindOptions.map(kind => (
                                        <Select.Option key={kind.value} value={kind.value}>
                                            <Space>
                                                <span style={{ color: kind.color }}>{kind.icon}</span>
                                                {kind.label}
                                            </Space>
                                        </Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item label="Địa chỉ" name="address">
                        <Input size="large" placeholder="Nhập địa chỉ đầy đủ" />
                    </Form.Item>

                    <Space style={{ marginBottom: 16 }}>
                        <Button
                            type={pickOnMap ? 'primary' : 'default'}
                            icon={<AimOutlined />}
                            onClick={() => setPickOnMap(!pickOnMap)}
                        >
                            {pickOnMap ? 'Đang chọn trên bản đồ...' : 'Chọn tọa độ trên bản đồ'}
                        </Button>
                    </Space>

                    <Form.Item noStyle shouldUpdate>
                        {() => {
                            const lat = form.getFieldValue('latitude');
                            const lng = form.getFieldValue('longitude');
                            return (
                                <FacilityMapPicker
                                    latitude={lat ? Number(lat) : null}
                                    longitude={lng ? Number(lng) : null}
                                    pickEnabled={pickOnMap}
                                    onPick={(pickedLat, pickedLng) => {
                                        form.setFieldsValue({
                                            latitude: pickedLat.toString(),
                                            longitude: pickedLng.toString(),
                                        });
                                        setPickOnMap(false);
                                    }}
                                />
                            );
                        }}
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item label="Vĩ độ" name="latitude">
                                <InputNumber style={{ width: '100%' }} step={0.000001} placeholder="21.0285" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="Kinh độ" name="longitude">
                                <InputNumber style={{ width: '100%' }} step={0.000001} placeholder="105.8542" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item label="Sức chứa" name="capacity">
                                <InputNumber style={{ width: '100%' }} min={1} placeholder="500" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="Giờ mở cửa" name="openingTime">
                                <TimePicker style={{ width: '100%' }} format="HH:mm" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="Giờ đóng cửa" name="closingTime">
                                <TimePicker style={{ width: '100%' }} format="HH:mm" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item label="Khu vực" name="zoneId">
                        <Select placeholder="Chọn khu vực" allowClear size="large">
                            {zones.map(zone => (
                                <Select.Option key={zone.id} value={zone.id}>
                                    {zone.name}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Detail Drawer */}
            <Drawer
                title="Chi tiết cơ sở"
                placement="right"
                size={600}
                onClose={() => setDetailDrawerOpen(false)}
                open={detailDrawerOpen}
            >
                {selectedFacility && (
                    <Space orientation="vertical" size="large" style={{ width: '100%' }}>
                        <div style={{ textAlign: 'center' }}>
                            {(() => {
                                const kindOpt = kindOptions.find(k => k.value === selectedFacility.kind);
                                return (
                                    <>
                                        <div style={{ fontSize: 48, color: kindOpt?.color, marginBottom: 16 }}>
                                            {kindOpt?.icon}
                                        </div>
                                        <Title level={3} style={{ margin: 0 }}>{selectedFacility.name}</Title>
                                        <Tag color={kindOpt?.color} style={{ marginTop: 8 }}>
                                            {kindOpt?.label}
                                        </Tag>
                                    </>
                                );
                            })()}
                        </div>

                        <Descriptions column={1} bordered>
                            <Descriptions.Item label="Địa chỉ">
                                {selectedFacility.address || '—'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Tọa độ">
                                {selectedFacility.latitude && selectedFacility.longitude
                                    ? `${selectedFacility.latitude}, ${selectedFacility.longitude}`
                                    : '—'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Sức chứa">
                                {selectedFacility.capacity || '—'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Giờ hoạt động">
                                {selectedFacility.openingTime && selectedFacility.closingTime
                                    ? `${selectedFacility.openingTime} - ${selectedFacility.closingTime}`
                                    : '24/7'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Khu vực">
                                {zones.find(z => z.id === selectedFacility.zoneId)?.name || '—'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Trạng thái">
                                {selectedFacility.isActive ? (
                                    <Badge status="success" text="Hoạt động" />
                                ) : (
                                    <Badge status="error" text="Đóng cửa" />
                                )}
                            </Descriptions.Item>
                        </Descriptions>

                        <Space>
                            <Button type="primary" icon={<EditOutlined />} onClick={() => {
                                setDetailDrawerOpen(false);
                                handleEdit(selectedFacility);
                            }}>
                                Chỉnh sửa
                            </Button>
                            <Button danger icon={<DeleteOutlined />} onClick={() => {
                                Modal.confirm({
                                    title: 'Xóa cơ sở',
                                    content: `Bạn có chắc muốn xóa "${selectedFacility.name}"?`,
                                    okText: 'Xóa',
                                    cancelText: 'Hủy',
                                    okButtonProps: { danger: true },
                                    onOk: () => {
                                        handleDelete(selectedFacility.id);
                                        setDetailDrawerOpen(false);
                                    },
                                });
                            }}>
                                Xóa cơ sở
                            </Button>
                        </Space>
                    </Space>
                )}
            </Drawer>
        </Space>
    );
}
