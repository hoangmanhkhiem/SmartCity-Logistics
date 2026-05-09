'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardBody, CardHeader, DataTable, Badge, Button, Input, Modal } from '@/components/ui';
import { driversApi } from '@/lib/api';
import { Users, Search, Eye, Phone, Mail } from 'lucide-react';
import type { Column } from '@/components/ui';

type DriverRow = {
    id: string;
    name: string;
    email: string;
    phone?: string;
    isActive: boolean;
    assignmentsTotal: number;
};

export default function DeliveryDriversPage() {
    const [drivers, setDrivers] = useState<DriverRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selected, setSelected] = useState<DriverRow | null>(null);
    const [statsDetail, setStatsDetail] = useState<Record<string, unknown> | null>(null);
    const [statsLoading, setStatsLoading] = useState(false);

    const fetchDrivers = useCallback(async () => {
        setLoading(true);
        try {
            const response = await driversApi.list();
            setDrivers(response.data);
        } catch (error) {
            console.error('Failed to fetch drivers:', error);
            setDrivers([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDrivers();
    }, [fetchDrivers]);

    const openDetail = async (d: DriverRow) => {
        setSelected(d);
        setStatsDetail(null);
        setStatsLoading(true);
        try {
            const res = await driversApi.getStats(d.id);
            setStatsDetail(res.data);
        } catch (e) {
            console.error(e);
            setStatsDetail({ error: true });
        } finally {
            setStatsLoading(false);
        }
    };

    const columns: Column<DriverRow>[] = [
        {
            key: 'name',
            header: 'Họ tên',
            render: (u) => (
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        {u.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <span className="font-medium">{u.name}</span>
                </div>
            ),
        },
        { key: 'email', header: 'Email' },
        { key: 'phone', header: 'Điện thoại' },
        {
            key: 'assignmentsTotal',
            header: 'Phân công',
            render: (u) => <Badge variant="info">{u.assignmentsTotal}</Badge>,
        },
        {
            key: 'isActive',
            header: 'Trạng thái',
            render: (u) => (
                <Badge variant={u.isActive ? 'success' : 'error'}>{u.isActive ? 'Hoạt động' : 'Ngưng'}</Badge>
            ),
        },
        {
            key: 'actions',
            header: '',
            render: (u) => (
                <Button variant="ghost" size="sm" onClick={() => openDetail(u)}>
                    <Eye size={16} />
                </Button>
            ),
        },
    ];

    const filtered = drivers.filter(
        (u) =>
            u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.phone?.includes(searchQuery)
    );

    const stats = {
        total: drivers.length,
        active: drivers.filter((u) => u.isActive).length,
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Quản lý tài xế</h1>
                <p className="text-gray-500 mt-1">Role driver — hiệu suất & phân công (API /drivers)</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Card>
                    <CardBody className="flex items-center gap-3">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-xl">
                            <Users size={24} className="text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.total}</p>
                            <p className="text-sm text-gray-500">Tổng tài xế</p>
                        </div>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="flex items-center gap-3">
                        <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-xl">
                            <Users size={24} className="text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.active}</p>
                            <p className="text-sm text-gray-500">Đang hoạt động</p>
                        </div>
                    </CardBody>
                </Card>
            </div>

            <Card>
                <CardBody>
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <Input
                            placeholder="Tìm tên, email, số điện thoại..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardBody>
            </Card>

            <Card>
                <CardHeader>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Danh sách tài xế</h2>
                </CardHeader>
                <CardBody>
                    <DataTable
                        columns={columns}
                        data={filtered}
                        loading={loading}
                        emptyMessage="Chưa có tài xế (role driver) hoặc lỗi API"
                    />
                </CardBody>
            </Card>

            <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Tài xế & phân công" size="lg">
                {selected && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                                {selected.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{selected.name}</h3>
                                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300 mt-1">
                                    <Mail size={16} />
                                    <span className="text-sm">{selected.email}</span>
                                </div>
                                {selected.phone && (
                                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                                        <Phone size={16} />
                                        <span className="text-sm">{selected.phone}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="border-t pt-3">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">/drivers/:id/stats</p>
                            {statsLoading ? (
                                <p className="text-gray-500 text-sm">Đang tải...</p>
                            ) : (
                                <pre className="text-xs bg-gray-50 dark:bg-gray-900 p-3 rounded-lg overflow-auto max-h-64">
                                    {JSON.stringify(statsDetail, null, 2)}
                                </pre>
                            )}
                        </div>
                        <div className="flex justify-end pt-2">
                            <Button onClick={() => setSelected(null)}>Đóng</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
