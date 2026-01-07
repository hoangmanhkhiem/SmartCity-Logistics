'use client';

import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, Button, Input } from '@/components/ui';
import { organizationApi } from '@/lib/api';
import { Organization } from '@/types';
import { Settings, Building2, Save, Globe, Phone, Mail, MapPin } from 'lucide-react';

export default function LogisticsSettingsPage() {
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        address: '',
        phone: '',
        email: '',
        website: '',
    });
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        const fetchOrg = async () => {
            try {
                const response = await organizationApi.getAll({ limit: 1 });
                const orgs = response.data.data || response.data;
                if (orgs.length > 0) {
                    setOrganization(orgs[0]);
                    setFormData({
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
            } finally {
                setLoading(false);
            }
        };
        fetchOrg();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!organization) return;
        setSaving(true);
        setMessage({ type: '', text: '' });
        try {
            await organizationApi.update(organization.id, formData);
            setMessage({ type: 'success', text: 'Đã lưu thay đổi thành công!' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Có lỗi xảy ra khi lưu.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-3xl">
            <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Cài đặt công ty</h1>
                <p className="text-gray-500 mt-1">Quản lý thông tin tổ chức</p>
            </div>

            <Card>
                <CardHeader className="flex items-center gap-2">
                    <Building2 size={20} className="text-blue-500" />
                    <h2 className="text-lg font-semibold">Thông tin công ty</h2>
                </CardHeader>
                <CardBody>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            label="Tên công ty"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                        <Input
                            label="Mô tả"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                            <Input
                                label="Điện thoại"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                        <Input
                            label="Địa chỉ"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        />
                        <Input
                            label="Website"
                            value={formData.website}
                            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        />

                        {message.text && (
                            <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {message.text}
                            </div>
                        )}

                        <div className="flex justify-end pt-4">
                            <Button type="submit" isLoading={saving}>
                                <Save size={16} className="mr-1" />
                                Lưu thay đổi
                            </Button>
                        </div>
                    </form>
                </CardBody>
            </Card>
        </div>
    );
}
