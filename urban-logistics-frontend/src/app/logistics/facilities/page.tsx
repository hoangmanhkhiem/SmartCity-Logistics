'use client';

import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, DataTable, Badge, Select, Button, Input, Modal } from '@/components/ui';
import { facilityApi, zoneApi, organizationApi } from '@/lib/api';
import { Facility, Zone, Organization } from '@/types';
import { Building2, Plus, Search, Edit, Trash2, MapPin, Warehouse, Zap, Fuel } from 'lucide-react';
import type { Column } from '@/components/ui';

const kindOptions = [
    { value: '', label: 'Tất cả loại' },
    { value: 'hub', label: 'Hub giao nhận' },
    { value: 'warehouse', label: 'Kho bãi' },
    { value: 'charging_station', label: 'Trạm sạc' },
    { value: 'fuel_station', label: 'Trạm xăng' },
    { value: 'pickup_point', label: 'Điểm giao nhận' },
];

const kindIcons: Record<string, React.ReactNode> = {
    hub: <Building2 size={16} />,
    warehouse: <Warehouse size={16} />,
    charging_station: <Zap size={16} />,
    fuel_station: <Fuel size={16} />,
    pickup_point: <MapPin size={16} />,
};

export default function LogisticsFacilitiesPage() {
    const [facilities, setFacilities] = useState<Facility[]>([]);
    const [zones, setZones] = useState<Zone[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [kindFilter, setKindFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingFacility, setEditingFacility] = useState<Facility | null>(null);
    const [formData, setFormData] = useState({
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
            const [facilitiesRes, zonesRes] = await Promise.all([
                facilityApi.getAll({ page, limit: 10, kind: kindFilter || undefined }),
                zoneApi.getAll({ limit: 50 }),
            ]);
            setFacilities(facilitiesRes.data.data || facilitiesRes.data);
            setZones(zonesRes.data.data || zonesRes.data);
            setTotalPages(facilitiesRes.data.meta?.totalPages || 1);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [page, kindFilter]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const data = {
                ...formData,
                latitude: Number(formData.latitude) || 0,
                longitude: Number(formData.longitude) || 0,
                capacity: formData.capacity ? Number(formData.capacity) : undefined,
                zoneId: formData.zoneId || undefined,
            };

            if (editingFacility) {
                await facilityApi.update(editingFacility.id, data);
            } else {
                await facilityApi.create(data);
            }
            setIsModalOpen(false);
            setEditingFacility(null);
            resetForm();
            fetchData();
        } catch (error) {
            console.error('Failed to save facility:', error);
        }
    };

    const handleEdit = (facility: Facility) => {
        setEditingFacility(facility);
        setFormData({
            name: facility.name,
            kind: facility.kind,
            address: facility.address || '',
            latitude: facility.latitude?.toString() || '',
            longitude: facility.longitude?.toString() || '',
            capacity: facility.capacity?.toString() || '',
            openingTime: facility.openingTime || '',
            closingTime: facility.closingTime || '',
            zoneId: facility.zoneId || '',
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Bạn có chắc chắn muốn xóa cơ sở này?')) {
            try {
                await facilityApi.delete(id);
                fetchData();
            } catch (error) {
                console.error('Failed to delete facility:', error);
            }
        }
    };

    const resetForm = () => {
        setFormData({
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
    };

    const columns: Column<Facility>[] = [
        {
            key: 'name',
            header: 'Tên cơ sở',
            render: (f) => (
                <div className="flex items-center gap-2">
                    <span className="text-gray-500">{kindIcons[f.kind]}</span>
                    <span className="font-medium">{f.name}</span>
                </div>
            ),
        },
        {
            key: 'kind',
            header: 'Loại',
            render: (f) => kindOptions.find(k => k.value === f.kind)?.label || f.kind,
        },
        { key: 'address', header: 'Địa chỉ' },
        {
            key: 'capacity',
            header: 'Sức chứa',
            render: (f) => f.capacity || '-',
        },
        {
            key: 'isActive',
            header: 'Trạng thái',
            render: (f) => (
                <Badge variant={f.isActive ? 'success' : 'error'}>
                    {f.isActive ? 'Hoạt động' : 'Đóng cửa'}
                </Badge>
            ),
        },
        {
            key: 'actions',
            header: '',
            render: (f) => (
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(f)}>
                        <Edit size={16} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(f.id)}>
                        <Trash2 size={16} className="text-red-500" />
                    </Button>
                </div>
            ),
        },
    ];

    const filteredFacilities = facilities.filter((f) =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.address?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const zoneOptions = [
        { value: '', label: 'Chọn khu vực' },
        ...zones.map((z) => ({ value: z.id, label: z.name })),
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Quản lý cơ sở</h1>
                    <p className="text-gray-500 mt-1">Hub, kho bãi, trạm sạc và điểm giao nhận</p>
                </div>
                <Button onClick={() => { resetForm(); setEditingFacility(null); setIsModalOpen(true); }}>
                    <Plus size={18} className="mr-1" />
                    Thêm cơ sở
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['hub', 'warehouse', 'charging_station', 'fuel_station'].map((kind) => (
                    <Card key={kind}>
                        <CardBody className="flex items-center gap-3">
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-xl text-blue-600">
                                {kindIcons[kind]}
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-800 dark:text-white">
                                    {facilities.filter(f => f.kind === kind).length}
                                </p>
                                <p className="text-sm text-gray-500">
                                    {kindOptions.find(k => k.value === kind)?.label}
                                </p>
                            </div>
                        </CardBody>
                    </Card>
                ))}
            </div>

            {/* Filters */}
            <Card>
                <CardBody className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <Input
                                placeholder="Tìm tên, địa chỉ..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>
                    <div className="w-48">
                        <Select
                            options={kindOptions}
                            value={kindFilter}
                            onChange={(v) => { setKindFilter(v); setPage(1); }}
                        />
                    </div>
                </CardBody>
            </Card>

            {/* Table */}
            <Card>
                <CardHeader>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Danh sách cơ sở</h2>
                </CardHeader>
                <CardBody>
                    <DataTable
                        columns={columns}
                        data={filteredFacilities}
                        loading={loading}
                        emptyMessage="Chưa có cơ sở nào"
                        pagination={{ page, totalPages, onPageChange: setPage }}
                    />
                </CardBody>
            </Card>

            {/* Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingFacility(null); }}
                title={editingFacility ? 'Chỉnh sửa cơ sở' : 'Thêm cơ sở mới'}
                size="lg"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Tên cơ sở *"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                        <Select
                            label="Loại cơ sở"
                            options={kindOptions.slice(1)}
                            value={formData.kind}
                            onChange={(v) => setFormData({ ...formData, kind: v })}
                        />
                    </div>
                    <Input
                        label="Địa chỉ"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Vĩ độ"
                            type="number"
                            step="any"
                            value={formData.latitude}
                            onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                        />
                        <Input
                            label="Kinh độ"
                            type="number"
                            step="any"
                            value={formData.longitude}
                            onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <Input
                            label="Sức chứa"
                            type="number"
                            value={formData.capacity}
                            onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                        />
                        <Input
                            label="Giờ mở cửa"
                            type="time"
                            value={formData.openingTime}
                            onChange={(e) => setFormData({ ...formData, openingTime: e.target.value })}
                        />
                        <Input
                            label="Giờ đóng cửa"
                            type="time"
                            value={formData.closingTime}
                            onChange={(e) => setFormData({ ...formData, closingTime: e.target.value })}
                        />
                    </div>
                    <Select
                        label="Khu vực"
                        options={zoneOptions}
                        value={formData.zoneId}
                        onChange={(v) => setFormData({ ...formData, zoneId: v })}
                    />
                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                            Hủy
                        </Button>
                        <Button type="submit">
                            {editingFacility ? 'Cập nhật' : 'Thêm cơ sở'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
