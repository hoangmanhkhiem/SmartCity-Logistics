'use client';

import { useState, useEffect } from 'react';
import { Card, CardBody, Button, Input, Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui';
import { Settings, Building2, Save, Bell, Shield, Cog } from 'lucide-react';
import { organizationApi } from '@/lib/api';
import { Organization } from '@/types';

function ToggleRow({ label, description, defaultChecked }: { label: string; description: string; defaultChecked?: boolean }) {
    const [checked, setChecked] = useState(!!defaultChecked);
    return (
        <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-700 last:border-0">
            <div>
                <p className="text-sm font-medium text-slate-800 dark:text-white">{label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{description}</p>
            </div>
            <button
                onClick={() => setChecked((c) => !c)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${checked ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'}`}
            >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
        </div>
    );
}

export default function LogisticsSettingsPage() {
    const [tab, setTab] = useState('general');
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [formData, setFormData] = useState({
        name: '', description: '', address: '', phone: '', email: '', website: '',
    });

    useEffect(() => {
        organizationApi.getAll({ limit: 1 }).then((res) => {
            const orgs = res.data.data || res.data;
            if (orgs.length > 0) {
                const o = orgs[0];
                setOrganization(o);
                setFormData({
                    name: o.name || '', description: o.description || '', address: o.address || '',
                    phone: o.phone || '', email: o.email || '', website: o.website || '',
                });
            }
        }).catch((e) => console.error(e)).finally(() => setLoading(false));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!organization) return;
        setSaving(true);
        setSaved(false);
        try {
            await organizationApi.update(organization.id, formData);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (error) {
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="py-24 text-center text-slate-500">Đang tải cài đặt...</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-800 dark:text-white">
                    <Settings size={24} /> Cài đặt hệ thống
                </h1>
                <p className="text-slate-500 mt-1">Quản lý cấu hình và thông tin tổ chức</p>
            </div>

            <Card>
                <CardBody>
                    <Tabs value={tab} onChange={setTab}>
                        <TabsList>
                            <TabsTrigger value="general"><Building2 size={14} className="inline mr-1" /> Thông tin chung</TabsTrigger>
                            <TabsTrigger value="notifications"><Bell size={14} className="inline mr-1" /> Thông báo</TabsTrigger>
                            <TabsTrigger value="security"><Shield size={14} className="inline mr-1" /> Bảo mật</TabsTrigger>
                            <TabsTrigger value="system"><Cog size={14} className="inline mr-1" /> Hệ thống</TabsTrigger>
                        </TabsList>

                        <TabsContent value="general">
                            <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
                                <Input label="Tên tổ chức *" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Mô tả</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={3}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <Input label="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                                    <Input label="Điện thoại" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                                </div>
                                <Input label="Địa chỉ" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
                                <Input label="Website" value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} />
                                <div className="flex items-center gap-3 pt-2">
                                    <Button type="submit" disabled={saving}>
                                        <Save size={16} className="mr-1 inline" /> {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                                    </Button>
                                    {saved && <span className="text-sm text-green-600">Đã lưu thành công</span>}
                                </div>
                            </form>
                        </TabsContent>

                        <TabsContent value="notifications">
                            <div className="max-w-2xl">
                                <ToggleRow label="Email thông báo" description="Gửi thông báo qua email khi có sự kiện quan trọng" defaultChecked />
                                <ToggleRow label="SMS thông báo" description="Gửi tin nhắn SMS cho shipper và khách hàng" defaultChecked />
                                <ToggleRow label="Push notification" description="Thông báo đẩy qua ứng dụng di động" defaultChecked />
                                <ToggleRow label="Webhook" description="Gửi sự kiện đến endpoint bên ngoài" />
                            </div>
                        </TabsContent>

                        <TabsContent value="security">
                            <div className="max-w-2xl space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <Input label="Thời gian phiên đăng nhập (phút)" type="number" defaultValue={60} />
                                    <Input label="Số lần đăng nhập sai tối đa" type="number" defaultValue={5} />
                                </div>
                                <ToggleRow label="Yêu cầu xác thực 2 bước" description="Bắt buộc 2FA cho tài khoản admin/carrier-ops" />
                                <ToggleRow label="Bắt buộc mật khẩu mạnh" description="Yêu cầu mật khẩu tối thiểu 8 ký tự, có chữ hoa/số" defaultChecked />
                                <ToggleRow label="Ghi nhật ký truy cập" description="Lưu log đăng nhập/đăng xuất" defaultChecked />
                            </div>
                        </TabsContent>

                        <TabsContent value="system">
                            <div className="max-w-2xl space-y-4">
                                <ToggleRow label="Chế độ bảo trì" description="Tạm khóa truy cập cho carrier-ops/shipper" />
                                <ToggleRow label="Cho phép đăng ký carrier mới" description="Carrier mới có thể tự đăng ký qua form" defaultChecked />
                                <ToggleRow label="Ghi log debug" description="Bật log chi tiết cho môi trường dev" />
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardBody>
            </Card>
        </div>
    );
}
