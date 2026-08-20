'use client';

import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, DataTable, Badge, Select, Button, Input, Modal, Drawer, Tag, TimePicker } from '@/components/ui';
import type { Column } from '@/components/ui';
import { facilityApi, zoneApi, organizationApi } from '@/lib/api';
import { Facility, Zone, Organization } from '@/types';
import FacilityMapPicker from '@/components/logistics/facility-map-picker';
import {
    Warehouse,
    Plus,
    Search,
    MapPin,
    Zap,
    Fuel,
    Home,
    Package,
    Edit,
    Trash2,
    Crosshair,
    Clock,
    Eye,
} from 'lucide-react';

const kindOptions = [
    { value: 'hub', label: 'Hub giao nhận', icon: Home, color: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/40' },
    { value: 'warehouse', label: 'Kho bãi', icon: Package, color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/40' },
    { value: 'charging_station', label: 'Trạm sạc', icon: Zap, color: 'text-green-600 bg-green-100 dark:bg-green-900/40' },
    { value: 'fuel_station', label: 'Trạm xăng', icon: Fuel, color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/40' },
    { value: 'mfc', label: 'Điểm giao nhận (MFC)', icon: MapPin, color: 'text-cyan-600 bg-cyan-100 dark:bg-cyan-900/40' },
];

function kindMeta(kind: string) {
    return kindOptions.find((k) => k.value === kind) ?? kindOptions[0];
}

export default function LogisticsFacilitiesPage() {
    const [facilities, setFacilities] = useState<Facility[]>([]);
    const [zones, setZones] = useState<Zone[]>([]);
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [kindFilter, setKindFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [detailOpen, setDetailOpen] = useState(false);
    const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
    const [editingFacility, setEditingFacility] = useState<Facility | null>(null);
    const [pickOnMap, setPickOnMap] = useState(false);
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
                facilityApi.getAll({ page, limit: 10, kind: kindFilter || undefined }),
                zoneApi.getAll({ limit: 50 }),
                organizationApi.getAll({ limit: 100 }),
            ]);
            setFacilities(facilitiesRes.data.data || facilitiesRes.data);
            setZones(zonesRes.data.data || zonesRes.data);
            setOrganizations(orgRes.data.data || orgRes.data);
            setTotalPages(facilitiesRes.data.meta?.totalPages || 1);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, kindFilter]);

    const resetForm = () => {
        setFormData({
            organizationId: '', name: '', kind: 'hub', address: '', latitude: '', longitude: '',
            capacity: '', openingTime: '', closingTime: '', zoneId: '',
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const data = {
                organizationId: formData.organizationId ? Number(formData.organizationId) : undefined,
                name: formData.name,
                kind: formData.kind,
                address: formData.address || undefined,
                latitude: formData.latitude ? Number(formData.latitude) : undefined,
                longitude: formData.longitude ? Number(formData.longitude) : undefined,
                capacity: formData.capacity ? Number(formData.capacity) : undefined,
                openingTime: formData.openingTime || undefined,
                closingTime: formData.closingTime || undefined,
                zoneId: formData.zoneId ? Number(formData.zoneId) : undefined,
            };

            if (editingFacility) {
                const { organizationId: _o, ...patch } = data;
                await facilityApi.update(editingFacility.id, patch);
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
        setPickOnMap(false);
        setDetailOpen(false);
        setFormData({
            organizationId: String(facility.organizationId),
            name: facility.name,
            kind: facility.kind,
            address: facility.address || '',
            latitude: facility.latitude != null ? String(facility.latitude) : '',
            longitude: facility.longitude != null ? String(facility.longitude) : '',
            capacity: facility.capacity != null ? String(facility.capacity) : '',
            openingTime: facility.openingTime || '',
            closingTime: facility.closingTime || '',
            zoneId: facility.zoneId != null ? String(facility.zoneId) : '',
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Bạn có chắc muốn xóa cơ sở này?')) return;
        try {
            await facilityApi.delete(id);
            setDetailOpen(false);
            fetchData();
        } catch (error) {
            console.error('Failed to delete facility:', error);
        }
    };

    const columns: Column<Facility>[] = [
        {
            key: 'name',
            header: 'Tên cơ sở',
            render: (f) => {
                const meta = kindMeta(f.kind);
                const Icon = meta.icon;
                return (
                    <div>
                        <div className="flex items-center gap-2">
                            <Icon size={16} className={meta.color.split(' ')[0]} />
                            <span className="font-medium">{f.name}</span>
                        </div>
                        <Tag color="gray" className="mt-1">{meta.label}</Tag>
                    </div>
                );
            },
        },
        {
            key: 'address',
            header: 'Địa chỉ',
            render: (f) => (
                <span className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 max-w-[240px] block">
                    {f.address || '—'}
                </span>
            ),
        },
        { key: 'capacity', header: 'Sức chứa', render: (f) => f.capacity ?? '—' },
        {
            key: 'hours',
            header: 'Giờ hoạt động',
            render: (f) =>
                f.openingTime && f.closingTime ? (
                    <span className="flex items-center gap-1 text-sm"><Clock size={14} /> {f.openingTime} - {f.closingTime}</span>
                ) : '24/7',
        },
        {
            key: 'isActive',
            header: 'Trạng thái',
            render: (f) => <Badge variant={f.isActive ? 'success' : 'error'}>{f.isActive ? 'Hoạt động' : 'Đóng cửa'}</Badge>,
        },
        {
            key: 'actions',
            header: '',
            render: (f) => (
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => { setSelectedFacility(f); setDetailOpen(true); }}>
                        <Eye size={16} />
                    </Button>
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

    const filteredFacilities = facilities.filter(
        (f) => f.name.toLowerCase().includes(searchQuery.toLowerCase()) || f.address?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const facilityStats = kindOptions.map((k) => ({ ...k, count: facilities.filter((f) => f.kind === k.value).length }));
    const totalCapacity = facilities.reduce((sum, f) => sum + (f.capacity || 0), 0);
    const activeCount = facilities.filter((f) => f.isActive).length;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-800 dark:text-white">
                        <Warehouse size={24} /> Cơ sở logistics
                    </h1>
                    <p className="text-slate-500 mt-1">Hub giao nhận, kho bãi, trạm sạc và điểm phục vụ</p>
                </div>
                <Button onClick={() => { resetForm(); setEditingFacility(null); setPickOnMap(false); setIsModalOpen(true); }}>
                    <Plus size={18} className="mr-1" /> Thêm cơ sở
                </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
                {facilityStats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <Card key={stat.value}>
                            <CardBody className="flex items-center gap-2 !p-3">
                                <div className={`p-2 rounded-lg ${stat.color}`}>
                                    <Icon size={18} />
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-slate-800 dark:text-white">{stat.count}</p>
                                    <p className="text-xs text-slate-500 truncate">{stat.label}</p>
                                </div>
                            </CardBody>
                        </Card>
                    );
                })}
                <Card>
                    <CardBody className="flex items-center gap-2 !p-3">
                        <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600">
                            <Package size={18} />
                        </div>
                        <div>
                            <p className="text-lg font-bold text-slate-800 dark:text-white">{activeCount}</p>
                            <p className="text-xs text-slate-500">Hoạt động</p>
                        </div>
                    </CardBody>
                </Card>
            </div>

            <Card>
                <CardBody className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[220px]">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <Input placeholder="Tìm tên cơ sở, địa chỉ..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
                        </div>
                    </div>
                    <div className="w-56">
                        <Select
                            options={[{ value: '', label: 'Tất cả loại' }, ...kindOptions.map((k) => ({ value: k.value, label: k.label }))]}
                            value={kindFilter}
                            onChange={(v) => { setKindFilter(v); setPage(1); }}
                        />
                    </div>
                </CardBody>
            </Card>

            <Card>
                <CardHeader>
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Danh sách cơ sở ({filteredFacilities.length})</h2>
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

            {/* Create/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingFacility(null); }}
                title={editingFacility ? 'Chỉnh sửa cơ sở' : 'Thêm cơ sở mới'}
                size="xl"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    {!editingFacility && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tổ chức *</label>
                            <select
                                value={formData.organizationId}
                                onChange={(e) => setFormData({ ...formData, organizationId: e.target.value })}
                                required
                                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                            >
                                <option value="">Chọn tổ chức...</option>
                                {organizations.map((org) => (
                                    <option key={org.id} value={org.id}>{org.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Tên cơ sở *" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required placeholder="Ví dụ: Hub Cầu Giấy" />
                        <Select label="Loại cơ sở" options={kindOptions.map((k) => ({ value: k.value, label: k.label }))} value={formData.kind} onChange={(v) => setFormData({ ...formData, kind: v })} />
                    </div>

                    <Input label="Địa chỉ" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Nhập địa chỉ đầy đủ" />

                    <Button type="button" variant={pickOnMap ? 'primary' : 'outline'} size="sm" onClick={() => setPickOnMap(!pickOnMap)}>
                        <Crosshair size={16} className="mr-1 inline" />
                        {pickOnMap ? 'Đang chọn trên bản đồ...' : 'Chọn tọa độ trên bản đồ'}
                    </Button>

                    <FacilityMapPicker
                        latitude={formData.latitude ? Number(formData.latitude) : null}
                        longitude={formData.longitude ? Number(formData.longitude) : null}
                        pickEnabled={pickOnMap}
                        onPick={(lat, lng) => {
                            setFormData((prev) => ({ ...prev, latitude: String(lat), longitude: String(lng) }));
                            setPickOnMap(false);
                        }}
                        className="h-64"
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Vĩ độ" type="number" step="0.000001" value={formData.latitude} onChange={(e) => setFormData({ ...formData, latitude: e.target.value })} placeholder="21.0285" />
                        <Input label="Kinh độ" type="number" step="0.000001" value={formData.longitude} onChange={(e) => setFormData({ ...formData, longitude: e.target.value })} placeholder="105.8542" />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <Input label="Sức chứa" type="number" min={1} value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: e.target.value })} placeholder="500" />
                        <TimePicker label="Giờ mở cửa" value={formData.openingTime} onChange={(v) => setFormData({ ...formData, openingTime: v })} />
                        <TimePicker label="Giờ đóng cửa" value={formData.closingTime} onChange={(v) => setFormData({ ...formData, closingTime: v })} />
                    </div>

                    <Select
                        label="Khu vực"
                        placeholder="Chọn khu vực"
                        options={zones.map((z) => ({ value: String(z.id), label: z.name }))}
                        value={formData.zoneId}
                        onChange={(v) => setFormData({ ...formData, zoneId: v })}
                    />

                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Hủy</Button>
                        <Button type="submit">{editingFacility ? 'Cập nhật' : 'Tạo cơ sở'}</Button>
                    </div>
                </form>
            </Modal>

            {/* Detail Drawer */}
            <Drawer isOpen={detailOpen} onClose={() => setDetailOpen(false)} title="Chi tiết cơ sở">
                {selectedFacility && (() => {
                    const meta = kindMeta(selectedFacility.kind);
                    const Icon = meta.icon;
                    return (
                        <div className="space-y-6">
                            <div className="text-center">
                                <div className={`inline-flex p-4 rounded-full mb-3 ${meta.color}`}>
                                    <Icon size={32} />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{selectedFacility.name}</h3>
                                <Tag color="gray" className="mt-1">{meta.label}</Tag>
                            </div>

                            <div className="space-y-3 rounded-lg border border-slate-200 dark:border-slate-700 p-4 text-sm">
                                <div><p className="text-slate-500">Địa chỉ</p><p className="font-medium">{selectedFacility.address || '—'}</p></div>
                                <div><p className="text-slate-500">Tọa độ</p><p className="font-medium">{selectedFacility.latitude && selectedFacility.longitude ? `${selectedFacility.latitude}, ${selectedFacility.longitude}` : '—'}</p></div>
                                <div><p className="text-slate-500">Sức chứa</p><p className="font-medium">{selectedFacility.capacity ?? '—'}</p></div>
                                <div><p className="text-slate-500">Giờ hoạt động</p><p className="font-medium">{selectedFacility.openingTime && selectedFacility.closingTime ? `${selectedFacility.openingTime} - ${selectedFacility.closingTime}` : '24/7'}</p></div>
                                <div><p className="text-slate-500">Khu vực</p><p className="font-medium">{zones.find((z) => z.id === selectedFacility.zoneId)?.name || '—'}</p></div>
                                <div><p className="text-slate-500">Trạng thái</p><Badge variant={selectedFacility.isActive ? 'success' : 'error'}>{selectedFacility.isActive ? 'Hoạt động' : 'Đóng cửa'}</Badge></div>
                            </div>

                            <div className="flex gap-2">
                                <Button onClick={() => handleEdit(selectedFacility)}><Edit size={16} className="mr-1 inline" /> Chỉnh sửa</Button>
                                <Button variant="outline" onClick={() => handleDelete(selectedFacility.id)}><Trash2 size={16} className="mr-1 inline text-red-500" /> Xóa cơ sở</Button>
                            </div>
                        </div>
                    );
                })()}
            </Drawer>
        </div>
    );
}
