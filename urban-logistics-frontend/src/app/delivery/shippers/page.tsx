'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardBody, CardHeader, DataTable, Badge, Button, Input, Modal } from '@/components/ui';
import { shipperApi } from '@/lib/api';
import { Users, Search, Eye, Phone, Mail, Truck } from 'lucide-react';
import type { Column } from '@/components/ui';

type ShipperRow = {
    id: number;
    userId: number;
    carrierId: number;
    licenseNumber?: string | null;
    status: string;
    isActive: boolean;
    routesTotal: number;
    user: { id: number; name: string; email: string; phone?: string; isActive: boolean };
    currentVehicle?: { id: number; plate: string; type: string } | null;
    defaultZone?: { id: number; name: string } | null;
};

const statusLabel: Record<string, string> = {
    on_shift: 'Đang trong ca',
    off_duty: 'Ngoài ca',
    on_break: 'Nghỉ giữa ca',
};

export default function DeliveryShippersPage() {
    const [shippers, setShippers] = useState<ShipperRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selected, setSelected] = useState<ShipperRow | null>(null);
    const [statsDetail, setStatsDetail] = useState<Record<string, unknown> | null>(null);
    const [statsLoading, setStatsLoading] = useState(false);

    const fetchShippers = useCallback(async () => {
        setLoading(true);
        try {
            const response = await shipperApi.listByCarrier();
            setShippers(response.data);
        } catch (error) {
            console.error('Failed to fetch shippers:', error);
            setShippers([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchShippers();
    }, [fetchShippers]);

    const openDetail = async (s: ShipperRow) => {
        setSelected(s);
        setStatsDetail(null);
        setStatsLoading(true);
        try {
            const res = await shipperApi.getStats(s.userId);
            setStatsDetail(res.data);
        } catch (e) {
            console.error(e);
            setStatsDetail({ error: true });
        } finally {
            setStatsLoading(false);
        }
    };

    const columns: Column<ShipperRow>[] = [
        {
            key: 'name',
            header: 'Họ tên',
            render: (s) => (
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        {s.user.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <span className="font-medium">{s.user.name}</span>
                </div>
            ),
        },
        { key: 'email', header: 'Email', render: (s) => s.user.email },
        { key: 'phone', header: 'Điện thoại', render: (s) => s.user.phone ?? '—' },
        {
            key: 'vehicle',
            header: 'Xe hiện tại',
            render: (s) => s.currentVehicle ? <span className="font-mono text-sm">{s.currentVehicle.plate}</span> : <span className="text-slate-400">—</span>,
        },
        {
            key: 'status',
            header: 'Ca làm việc',
            render: (s) => (
                <Badge variant={s.status === 'on_shift' ? 'success' : 'default'}>{statusLabel[s.status] ?? s.status}</Badge>
            ),
        },
        {
            key: 'routesTotal',
            header: 'Số chuyến',
            render: (s) => <Badge variant="info">{s.routesTotal}</Badge>,
        },
        {
            key: 'actions',
            header: '',
            render: (s) => (
                <Button variant="ghost" size="sm" onClick={() => openDetail(s)}>
                    <Eye size={16} />
                </Button>
            ),
        },
    ];

    const filtered = shippers.filter(
        (s) =>
            s.user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.user.phone?.includes(searchQuery)
    );

    const stats = {
        total: shippers.length,
        onShift: shippers.filter((s) => s.status === 'on_shift').length,
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Quản lý Shipper</h1>
                <p className="text-slate-500 mt-1">Đội shipper của carrier — ca làm việc & hiệu suất chuyến giao</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Card>
                    <CardBody className="flex items-center gap-3">
                        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl">
                            <Users size={24} className="text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.total}</p>
                            <p className="text-sm text-slate-500">Tổng shipper</p>
                        </div>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="flex items-center gap-3">
                        <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-xl">
                            <Truck size={24} className="text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.onShift}</p>
                            <p className="text-sm text-slate-500">Đang trong ca</p>
                        </div>
                    </CardBody>
                </Card>
            </div>

            <Card>
                <CardBody>
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
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
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Danh sách shipper</h2>
                </CardHeader>
                <CardBody>
                    <DataTable
                        columns={columns}
                        data={filtered}
                        loading={loading}
                        emptyMessage="Chưa có shipper trong carrier này"
                    />
                </CardBody>
            </Card>

            <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Shipper & hiệu suất" size="lg">
                {selected && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-indigo-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                                {selected.user.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-slate-800 dark:text-white">{selected.user.name}</h3>
                                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300 mt-1">
                                    <Mail size={16} />
                                    <span className="text-sm">{selected.user.email}</span>
                                </div>
                                {selected.user.phone && (
                                    <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                                        <Phone size={16} />
                                        <span className="text-sm">{selected.user.phone}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="border-t pt-3">
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Route theo trạng thái</p>
                            {statsLoading ? (
                                <p className="text-slate-500 text-sm">Đang tải...</p>
                            ) : (
                                <pre className="text-xs bg-slate-50 dark:bg-slate-900 p-3 rounded-lg overflow-auto max-h-64">
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
