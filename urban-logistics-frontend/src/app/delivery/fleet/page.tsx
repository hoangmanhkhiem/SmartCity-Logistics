'use client';

import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, DataTable, Badge, Select, Button, Input, Modal } from '@/components/ui';
import { vehicleApi, carrierApi } from '@/lib/api';
import { Vehicle, Carrier } from '@/types';
import { Truck, Plus, Search, Edit, Trash2, Zap, Fuel } from 'lucide-react';
import type { Column } from '@/components/ui';
import { viStatus, VEHICLE_STATUS_OPTIONS } from '@/lib/status-labels';

const vehicleTypeOptions = [
    { value: '', label: 'Tất cả loại xe' },
    { value: 'motorcycle', label: 'Xe máy' },
    { value: 'small_truck', label: 'Xe tải nhỏ' },
    { value: 'large_truck', label: 'Xe tải lớn' },
    { value: 'van', label: 'Xe van' },
    { value: 'electric_bike', label: 'Xe điện' },
];

const statusOptions = [{ value: '', label: 'Tất cả trạng thái' }, ...VEHICLE_STATUS_OPTIONS];

const statusVariant: Record<string, 'success' | 'info' | 'warning' | 'error'> = {
    available: 'success',
    in_use: 'info',
    maintenance: 'warning',
};

export default function DeliveryFleetPage() {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [typeFilter, setTypeFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
    const [formData, setFormData] = useState({
        type: 'motorcycle',
        plate: '',
        brand: '',
        model: '',
        capacity: '',
        fuelType: 'gasoline',
        isElectric: false,
    });

    const fetchVehicles = async () => {
        setLoading(true);
        try {
            const params: Record<string, unknown> = { page, limit: 10 };
            if (typeFilter) params.type = typeFilter;
            const response = await vehicleApi.getAll(params);
            setVehicles(response.data.data || response.data);
            setTotalPages(response.data.meta?.totalPages || 1);
        } catch (error) {
            console.error('Failed to fetch vehicles:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVehicles();
    }, [page, typeFilter]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const data = {
                ...formData,
                capacity: formData.capacity ? Number(formData.capacity) : undefined,
            };

            if (editingVehicle) {
                await vehicleApi.update(editingVehicle.id, data);
            } else {
                await vehicleApi.create(data);
            }
            setIsModalOpen(false);
            setEditingVehicle(null);
            resetForm();
            fetchVehicles();
        } catch (error) {
            console.error('Failed to save vehicle:', error);
        }
    };

    const handleEdit = (vehicle: Vehicle) => {
        setEditingVehicle(vehicle);
        setFormData({
            type: vehicle.type,
            plate: vehicle.plate,
            brand: vehicle.brand || '',
            model: vehicle.model || '',
            capacity: vehicle.capacity?.toString() || '',
            fuelType: vehicle.fuelType || 'gasoline',
            isElectric: vehicle.isElectric,
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Bạn có chắc chắn muốn xóa xe này?')) {
            try {
                await vehicleApi.delete(id);
                fetchVehicles();
            } catch (error) {
                console.error('Failed to delete vehicle:', error);
            }
        }
    };

    const resetForm = () => {
        setFormData({
            type: 'motorcycle',
            plate: '',
            brand: '',
            model: '',
            capacity: '',
            fuelType: 'gasoline',
            isElectric: false,
        });
    };

    const columns: Column<Vehicle>[] = [
        {
            key: 'plate',
            header: 'Biển số',
            render: (v) => <span className="font-mono font-semibold">{v.plate}</span>
        },
        {
            key: 'type',
            header: 'Loại xe',
            render: (v) => (
                <div className="flex items-center gap-2">
                    {v.isElectric ? <Zap size={16} className="text-green-500" /> : <Fuel size={16} className="text-orange-500" />}
                    {vehicleTypeOptions.find(t => t.value === v.type)?.label || v.type}
                </div>
            ),
        },
        { key: 'brand', header: 'Hãng xe' },
        { key: 'model', header: 'Model' },
        {
            key: 'capacity',
            header: 'Tải trọng',
            render: (v) => v.capacity ? `${v.capacity} kg` : '-'
        },
        {
            key: 'status',
            header: 'Trạng thái',
            render: (v) => (
                <Badge variant={statusVariant[v.status] || 'default'}>
                    {viStatus(v.status)}
                </Badge>
            ),
        },
        {
            key: 'actions',
            header: '',
            render: (v) => (
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(v)}>
                        <Edit size={16} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(v.id)}>
                        <Trash2 size={16} className="text-red-500" />
                    </Button>
                </div>
            ),
        },
    ];

    const filteredVehicles = vehicles.filter((v) => {
        const matchesSearch =
            v.plate.toLowerCase().includes(searchQuery.toLowerCase()) ||
            v.brand?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = !statusFilter || v.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // Stats
    const stats = {
        total: vehicles.length,
        available: vehicles.filter(v => v.status === 'available').length,
        inUse: vehicles.filter(v => v.status === 'in_use').length,
        electric: vehicles.filter(v => v.isElectric).length,
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Quản lý đội xe</h1>
                    <p className="text-gray-500 mt-1">Quản lý phương tiện vận chuyển</p>
                </div>
                <Button onClick={() => { resetForm(); setEditingVehicle(null); setIsModalOpen(true); }}>
                    <Plus size={18} className="mr-1" />
                    Thêm xe
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardBody className="flex items-center gap-3">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-xl">
                            <Truck size={24} className="text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.total}</p>
                            <p className="text-sm text-gray-500">Tổng xe</p>
                        </div>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="flex items-center gap-3">
                        <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-xl">
                            <Truck size={24} className="text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.available}</p>
                            <p className="text-sm text-gray-500">Sẵn sàng</p>
                        </div>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="flex items-center gap-3">
                        <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-xl">
                            <Truck size={24} className="text-purple-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.inUse}</p>
                            <p className="text-sm text-gray-500">Đang sử dụng</p>
                        </div>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="flex items-center gap-3">
                        <div className="p-3 bg-teal-100 dark:bg-teal-900/50 rounded-xl">
                            <Zap size={24} className="text-teal-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.electric}</p>
                            <p className="text-sm text-gray-500">Xe điện</p>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardBody className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <Input
                                placeholder="Tìm biển số, hãng xe..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>
                    <div className="w-40">
                        <Select
                            options={vehicleTypeOptions}
                            value={typeFilter}
                            onChange={(v) => { setTypeFilter(v); setPage(1); }}
                        />
                    </div>
                    <div className="w-40">
                        <Select
                            options={statusOptions}
                            value={statusFilter}
                            onChange={setStatusFilter}
                        />
                    </div>
                </CardBody>
            </Card>

            {/* Table */}
            <Card>
                <CardHeader>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Danh sách xe</h2>
                </CardHeader>
                <CardBody>
                    <DataTable
                        columns={columns}
                        data={filteredVehicles}
                        loading={loading}
                        emptyMessage="Chưa có xe nào"
                        pagination={{ page, totalPages, onPageChange: setPage }}
                    />
                </CardBody>
            </Card>

            {/* Add/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingVehicle(null); }}
                title={editingVehicle ? 'Chỉnh sửa xe' : 'Thêm xe mới'}
                size="lg"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Biển số *"
                            value={formData.plate}
                            onChange={(e) => setFormData({ ...formData, plate: e.target.value })}
                            required
                            placeholder="29A-12345"
                        />
                        <Select
                            label="Loại xe"
                            options={vehicleTypeOptions.slice(1)}
                            value={formData.type}
                            onChange={(v) => setFormData({ ...formData, type: v })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Hãng xe"
                            value={formData.brand}
                            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                            placeholder="Honda, Toyota..."
                        />
                        <Input
                            label="Model"
                            value={formData.model}
                            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                            placeholder="Wave, Vios..."
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Tải trọng (kg)"
                            type="number"
                            value={formData.capacity}
                            onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                            placeholder="500"
                        />
                        <Select
                            label="Nhiên liệu"
                            options={[
                                { value: 'gasoline', label: 'Xăng' },
                                { value: 'diesel', label: 'Dầu' },
                                { value: 'electric', label: 'Điện' },
                            ]}
                            value={formData.fuelType}
                            onChange={(v) => setFormData({
                                ...formData,
                                fuelType: v,
                                isElectric: v === 'electric'
                            })}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="isElectric"
                            checked={formData.isElectric}
                            onChange={(e) => setFormData({ ...formData, isElectric: e.target.checked })}
                            className="w-4 h-4 rounded border-gray-300"
                        />
                        <label htmlFor="isElectric" className="text-sm text-gray-700 dark:text-gray-300">
                            Xe điện
                        </label>
                    </div>
                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                            Hủy
                        </Button>
                        <Button type="submit">
                            {editingVehicle ? 'Cập nhật' : 'Thêm xe'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
