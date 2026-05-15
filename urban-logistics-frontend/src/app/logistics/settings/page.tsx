'use client';

import { useState, useEffect } from 'react';
import {
    Card,
    Form,
    Input,
    Button,
    Space,
    Typography,
    Row,
    Col,
    Tabs,
    Switch,
    Select,
    Divider,
    Spin,
    message,
    Alert,
} from 'antd';
import {
    SettingOutlined,
    BuildOutlined,
    MailOutlined,
    PhoneOutlined,
    GlobalOutlined,
    EnvironmentOutlined,
    SaveOutlined,
    BellOutlined,
    SafetyOutlined,
    ControlOutlined,
} from '@ant-design/icons';
import { organizationApi } from '@/lib/api';
import { Organization } from '@/types';

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function LogisticsSettingsPage() {
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form] = Form.useForm();

    useEffect(() => {
        const fetchOrg = async () => {
            try {
                const response = await organizationApi.getAll({ limit: 1 });
                const orgs = response.data.data || response.data;
                if (orgs.length > 0) {
                    setOrganization(orgs[0]);
                    form.setFieldsValue({
                        name: orgs[0].name || '',
                        description: orgs[0].description || '',
                        address: orgs[0].address || '',
                        phone: orgs[0].phone || '',
                        email: orgs[0].email || '',
                        website: orgs[0].website || '',
                    });
                }
            } catch (error) {
                console.error('Failed to fetch organization:', error);
                message.error('Không thể tải thông tin tổ chức');
            } finally {
                setLoading(false);
            }
        };
        fetchOrg();
    }, [form]);

    const handleSubmit = async (values: any) => {
        if (!organization) return;
        setSaving(true);
        try {
            await organizationApi.update(organization.id, values);
            message.success('Đã lưu thay đổi thành công!');
        } catch (error) {
            console.error(error);
            message.error('Có lỗi xảy ra khi lưu');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '100px 0' }}>
                <Spin size="large" />
                <div style={{ marginTop: 16, color: '#666' }}>Đang tải cài đặt...</div>
            </div>
        );
    }

    const tabItems = [
        {
            key: 'general',
            label: (
                <span>
                    <BuildOutlined /> Thông tin chung
                </span>
            ),
            children: (
                <Card variant="borderless">
                    <Form form={form} layout="vertical" onFinish={handleSubmit}>
                        <Row gutter={16}>
                            <Col xs={24}>
                                <Form.Item
                                    label="Tên công ty"
                                    name="name"
                                    rules={[{ required: true, message: 'Vui lòng nhập tên công ty' }]}
                                >
                                    <Input prefix={<BuildOutlined />} size="large" placeholder="Nhập tên công ty" />
                                </Form.Item>
                            </Col>

                            <Col xs={24}>
                                <Form.Item label="Mô tả" name="description">
                                    <TextArea rows={4} placeholder="Mô tả về công ty..." />
                                </Form.Item>
                            </Col>

                            <Col xs={24} md={12}>
                                <Form.Item
                                    label="Email"
                                    name="email"
                                    rules={[{ type: 'email', message: 'Email không hợp lệ' }]}
                                >
                                    <Input prefix={<MailOutlined />} size="large" placeholder="email@company.com" />
                                </Form.Item>
                            </Col>

                            <Col xs={24} md={12}>
                                <Form.Item label="Điện thoại" name="phone">
                                    <Input prefix={<PhoneOutlined />} size="large" placeholder="0987654321" />
                                </Form.Item>
                            </Col>

                            <Col xs={24}>
                                <Form.Item label="Địa chỉ" name="address">
                                    <Input prefix={<EnvironmentOutlined />} size="large" placeholder="Địa chỉ công ty" />
                                </Form.Item>
                            </Col>

                            <Col xs={24}>
                                <Form.Item label="Website" name="website">
                                    <Input prefix={<GlobalOutlined />} size="large" placeholder="https://company.com" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Divider />

                        <Form.Item>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={saving}
                                size="large"
                                icon={<SaveOutlined />}
                            >
                                Lưu thay đổi
                            </Button>
                        </Form.Item>
                    </Form>
                </Card>
            ),
        },
        {
            key: 'notifications',
            label: (
                <span>
                    <BellOutlined /> Thông báo
                </span>
            ),
            children: (
                <Card variant="borderless">
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                        <Alert
                            message="Cài đặt thông báo"
                            description="Quản lý các kênh thông báo cho hệ thống logistics"
                            type="info"
                            showIcon
                        />

                        <div>
                            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <Text strong>Email thông báo</Text>
                                        <br />
                                        <Text type="secondary">Gửi thông báo qua email khi có sự kiện quan trọng</Text>
                                    </div>
                                    <Switch defaultChecked />
                                </div>

                                <Divider style={{ margin: 0 }} />

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <Text strong>SMS thông báo</Text>
                                        <br />
                                        <Text type="secondary">Gửi tin nhắn SMS cho tài xế và khách hàng</Text>
                                    </div>
                                    <Switch defaultChecked />
                                </div>

                                <Divider style={{ margin: 0 }} />

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <Text strong>Push notification</Text>
                                        <br />
                                        <Text type="secondary">Thông báo đẩy qua ứng dụng di động</Text>
                                    </div>
                                    <Switch defaultChecked />
                                </div>

                                <Divider style={{ margin: 0 }} />

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <Text strong>Webhook</Text>
                                        <br />
                                        <Text type="secondary">Gửi sự kiện đến endpoint bên ngoài</Text>
                                    </div>
                                    <Switch />
                                </div>
                            </Space>
                        </div>

                        <Button type="primary" size="large" icon={<SaveOutlined />}>
                            Lưu cài đặt
                        </Button>
                    </Space>
                </Card>
            ),
        },
        {
            key: 'security',
            label: (
                <span>
                    <SafetyOutlined /> Bảo mật
                </span>
            ),
            children: (
                <Card variant="borderless">
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                        <Alert
                            message="Cài đặt bảo mật"
                            description="Quản lý các chính sách bảo mật cho hệ thống"
                            type="warning"
                            showIcon
                        />

                        <Form layout="vertical">
                            <Form.Item label="Thời gian phiên đăng nhập (phút)">
                                <Input type="number" defaultValue={60} size="large" />
                            </Form.Item>

                            <Form.Item label="Số lần đăng nhập sai tối đa">
                                <Input type="number" defaultValue={5} size="large" />
                            </Form.Item>

                            <Form.Item label="Thời gian khóa tài khoản (phút)">
                                <Input type="number" defaultValue={15} size="large" />
                            </Form.Item>

                            <Divider />

                            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text strong>Yêu cầu xác thực 2 bước</Text>
                                    <Switch />
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text strong>Bắt buộc mật khẩu mạnh</Text>
                                    <Switch defaultChecked />
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text strong>Ghi nhật ký truy cập</Text>
                                    <Switch defaultChecked />
                                </div>
                            </Space>

                            <Divider />

                            <Button type="primary" size="large" icon={<SaveOutlined />}>
                                Lưu cài đặt
                            </Button>
                        </Form>
                    </Space>
                </Card>
            ),
        },
        {
            key: 'system',
            label: (
                <span>
                    <ControlOutlined /> Hệ thống
                </span>
            ),
            children: (
                <Card variant="borderless">
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                        <Alert
                            message="Cài đặt hệ thống"
                            description="Cấu hình các tham số kỹ thuật của hệ thống"
                            type="info"
                            showIcon
                        />

                        <Form layout="vertical">
                            <Form.Item label="Ngôn ngữ mặc định">
                                <Select size="large" defaultValue="vi">
                                    <Select.Option value="vi">Tiếng Việt</Select.Option>
                                    <Select.Option value="en">English</Select.Option>
                                </Select>
                            </Form.Item>

                            <Form.Item label="Múi giờ">
                                <Select size="large" defaultValue="Asia/Ho_Chi_Minh">
                                    <Select.Option value="Asia/Ho_Chi_Minh">Hồ Chí Minh (GMT+7)</Select.Option>
                                    <Select.Option value="Asia/Bangkok">Bangkok (GMT+7)</Select.Option>
                                </Select>
                            </Form.Item>

                            <Form.Item label="Đơn vị khoảng cách">
                                <Select size="large" defaultValue="km">
                                    <Select.Option value="km">Kilomet (km)</Select.Option>
                                    <Select.Option value="mi">Dặm (mi)</Select.Option>
                                </Select>
                            </Form.Item>

                            <Form.Item label="Định dạng ngày tháng">
                                <Select size="large" defaultValue="DD/MM/YYYY">
                                    <Select.Option value="DD/MM/YYYY">DD/MM/YYYY</Select.Option>
                                    <Select.Option value="MM/DD/YYYY">MM/DD/YYYY</Select.Option>
                                    <Select.Option value="YYYY-MM-DD">YYYY-MM-DD</Select.Option>
                                </Select>
                            </Form.Item>

                            <Divider />

                            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text strong>Chế độ bảo trì</Text>
                                    <Switch />
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text strong>Cho phép đăng ký mới</Text>
                                    <Switch defaultChecked />
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text strong>Ghi log debug</Text>
                                    <Switch />
                                </div>
                            </Space>

                            <Divider />

                            <Button type="primary" size="large" icon={<SaveOutlined />}>
                                Lưu cài đặt
                            </Button>
                        </Form>
                    </Space>
                </Card>
            ),
        },
    ];

    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* Header */}
            <div>
                <Title level={2} style={{ margin: 0 }}>
                    <SettingOutlined /> Cài đặt hệ thống
                </Title>
                <Text type="secondary">Quản lý cấu hình và thông tin tổ chức</Text>
            </div>

            {/* Tabs */}
            <Card variant="borderless">
                <Tabs defaultActiveKey="general" items={tabItems} size="large" />
            </Card>
        </Space>
    );
}
