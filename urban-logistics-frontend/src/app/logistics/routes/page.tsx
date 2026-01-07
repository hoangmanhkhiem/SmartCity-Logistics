'use client';

import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, DataTable, Badge, Select, Button, Input, Modal } from '@/components/ui';
import { routeApi } from '@/lib/api';
import { Route } from '@/types';
import { Route as RouteIcon, Plus, Search, Edit, Trash2, MapPin, Leaf } from 'lucide-react';
import type { Column } from '@/components/ui';

const modeOptions = [
    { value: '', label: 'Tất cả phương thức' },
    { value: 'road', label: 'Đường bộ' },
    { value: 'mixed', label: 'Kết hợp' },
];

const statusVariant: Record<string, 'warning' | 'success' | 'info'> = {
    planned: 'warning',
    active: 'success',
    completed: 'info',
};

const statusLabel: Record<string, string> = {
    planned: 'Dự kiến',
    active: 'Đang chạy',
    completed: 'Hoàn thành',
};

export default function LogisticsRoutesPage() {
    const [routes, setRoutes] = useState<Route[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRoute, setEditingRoute] = useState<Route | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        mode: 'road',
        description: '',
        totalDistance: '',
        estimatedCo2: '',
    });

    const fetchRoutes = async () => {
        setLoading(true);
        try {
            const response = await routeApi.getAll({ page, limit: 10 });
            setRoutes(response.data.data || response.data);
            setTotalPages(response.data.meta?.totalPages || 1);
        } catch (error) {
            console.error('Failed to fetch routes:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoutes();
    }, [page]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const data = {
                ...formData,
                totalDistance: formData.totalDistance ? Number(formData.totalDistance) * 1000 : undefined,
                estimatedCo2: formData.estimatedCo2 ? Number(formData.estimatedCo2) : undefined,
            };

            if (editingRoute) {
                await routeApi.update(editingRoute.id, data);
            } else {
                await routeApi.create(data);
            }
            setIsModalOpen(false);
            setEditingRoute(null);
            resetForm();
            fetchRoutes();
        } catch (error) {
            console.error('Failed to save route:', error);
        }
    };

    const handleEdit = (route: Route) => {
        setEditingRoute(route);
        setFormData({
            name: route.name,
            mode: route.mode,
            description: route.description || '',
            totalDistance: route.totalDistance ? (route.totalDistance / 1000).toString() : '',
            estimatedCo2: route.estimatedCo2?.toString() || '',
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Bạn có chắc chắn muốn xóa tuyến này?')) {
            try {
                await routeApi.delete(id);
                fetchRoutes();
            } catch (error) {
                console.error('Failed to delete route:', error);
            }
        }
    };

    const resetForm = () => {
        setFormData({ name: '', mode: 'road', description: '', totalDistance: '', estimatedCo2: '' });
    };

    const columns: Column<Route>[] = [
        { key: 'name', header: 'Tên tuyến' },
        {
            key: 'mode',
            header: 'Phương thức',
            render: (r) => modeOptions.find(m => m.value === r.mode)?.label || r.mode,
        },
        {
            key: 'totalDistance',
            header: 'Khoảng cách',
            render: (r) => r.totalDistance ? `${(r.totalDistance / 1000).toFixed(1)} km` : '-',
        },
        {
            key: 'estimatedCo2',
            header: 'CO₂',
            render: (r) => r.estimatedCo2 ? `${r.estimatedCo2.toFixed(1)} kg` : '-',
        },
        {
            key: 'status',
            header: 'Trạng thái',
            render: (r) => (
                <Badge variant={statusVariant[r.status] || 'default'}>
                    {statusLabel[r.status] || r.status}
                </Badge>
            ),
        },
        {
            key: 'actions',
            header: '',
            render: (r) => (
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(r)}>
                        <Edit size={16} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(r.id)}>
                        <Trash2 size={16} className="text-red-500" />
                    </Button>
                </div>
            ),
        },
    ];

    const filteredRoutes = routes.filter((r) =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Quản lý tuyến đường</h1>
                    <p className="text-gray-500 mt-1">Lập kế hoạch vận tải</p>
                </div>
                <Button onClick={() => { resetForm(); setEditingRoute(null); setIsModalOpen(true); }}>
                    <Plus size={18} className="mr-1" />
                    Thêm tuyến
                </Button>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <Card>
                    <CardBody className="flex items-center gap-3">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-xl">
                            <RouteIcon size={24} className="text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{routes.length}</p>
                            <p className="text-sm text-gray-500">Tổng tuyến</p>
                        </div>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="flex items-center gap-3">
                        <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-xl">
                            <MapPin size={24} className="text-purple-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">
                                {(routes.reduce((sum, r) => sum + (r.totalDistance || 0), 0) / 1000).toFixed(0)}
                            </p>
                            <p className="text-sm text-gray-500">km tổng</p>
                        </div>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="flex items-center gap-3">
                        <div className="p-3 bg-teal-100 dark:bg-teal-900/50 rounded-xl">
                            <Leaf size={24} className="text-teal-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">
                                {routes.reduce((sum, r) => sum + (r.estimatedCo2 || 0), 0).toFixed(0)}
                            </p>
                            <p className="text-sm text-gray-500">kg CO₂</p>
                        </div>
                    </CardBody>
                </Card>
            </div>

            <Card>
                <CardBody>
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <Input
                            placeholder="Tìm tên tuyến..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardBody>
            </Card>

            <Card>
                <CardHeader>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Danh sách tuyến</h2>
                </CardHeader>
                <CardBody>
                    <DataTable
                        columns={columns}
                        data={filteredRoutes}
                        loading={loading}
                        emptyMessage="Chưa có tuyến nào"
                        pagination={{ page, totalPages, onPageChange: setPage }}
                    />
                </CardBody>
            </Card>

            <Modal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingRoute(null); }}
                title={editingRoute ? 'Chỉnh sửa tuyến' : 'Thêm tuyến mới'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Tên tuyến *"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                    />
                    <Select
                        label="Phương thức"
                        options={modeOptions.slice(1)}
                        value={formData.mode}
                        onChange={(v) => setFormData({ ...formData, mode: v })}
                    />
                    <Input
                        label="Mô tả"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Khoảng cách (km)"
                            type="number"
                            value={formData.totalDistance}
                            onChange={(e) => setFormData({ ...formData, totalDistance: e.target.value })}
                        />
                        <Input
                            label="CO₂ ước tính (kg)"
                            type="number"
                            value={formData.estimatedCo2}
                            onChange={(e) => setFormData({ ...formData, estimatedCo2: e.target.value })}
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                            Hủy
                        </Button>
                        <Button type="submit">{editingRoute ? 'Cập nhật' : 'Thêm'}</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
