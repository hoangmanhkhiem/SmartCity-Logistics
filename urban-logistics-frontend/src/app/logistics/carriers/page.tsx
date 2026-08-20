'use client';

import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, DataTable, Badge, Button, Input, Modal } from '@/components/ui';
import { carrierApi, organizationApi, zoneApi } from '@/lib/api';
import { Carrier, Organization, Zone } from '@/types';
import { Truck, Plus, Search, Edit, Eye, Building2, MapPin } from 'lucide-react';
import type { Column } from '@/components/ui';

export default function LogisticsCarriersPage() {
    const [carriers, setCarriers] = useState<Carrier[]>([]);
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [zones, setZones] = useState<Zone[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCarrier, setSelectedCarrier] = useState<Carrier | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCarrier, setEditingCarrier] = useState<Carrier | null>(null);
    const [zonesModalOpen, setZonesModalOpen] = useState(false);
    const [zoneSelection, setZoneSelection] = useState<Set<number>>(new Set());
    const [formData, setFormData] = useState({
        organizationId: '',
        name: '',
        contactName: '',
        contactPhone: '',
        contactEmail: '',
    });

    const fetchCarriers = async () => {
        setLoading(true);
        try {
            const response = await carrierApi.getAll({ page, limit: 10 });
            setCarriers(response.data.data || response.data);
            setTotalPages(response.data.meta?.totalPages || 1);
        } catch (error) {
            console.error('Failed to fetch carriers:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCarriers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]);

    useEffect(() => {
        organizationApi.getAll({ limit: 100 }).then((res) => setOrganizations(res.data.data ?? res.data)).catch(() => setOrganizations([]));
        zoneApi.getAll({ limit: 100 }).then((res) => setZones(res.data.data ?? res.data)).catch(() => setZones([]));
    }, []);

    const zoneName = (id: number) => zones.find((z) => z.id === id)?.name ?? `Zone #${id}`;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const data = {
                organizationId: Number(formData.organizationId),
                name: formData.name,
                contactName: formData.contactName || undefined,
                contactPhone: formData.contactPhone || undefined,
                contactEmail: formData.contactEmail || undefined,
            };
            if (editingCarrier) {
                await carrierApi.update(editingCarrier.id, data);
            } else {
                await carrierApi.create(data);
            }
            setIsModalOpen(false);
            setEditingCarrier(null);
            resetForm();
            fetchCarriers();
        } catch (error) {
            console.error('Failed to save carrier:', error);
        }
    };

    const handleEdit = (c: Carrier) => {
        setEditingCarrier(c);
        setFormData({
            organizationId: String(c.organizationId),
            name: c.name,
            contactName: c.contactName || '',
            contactPhone: c.contactPhone || '',
            contactEmail: c.contactEmail || '',
        });
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setFormData({ organizationId: '', name: '', contactName: '', contactPhone: '', contactEmail: '' });
    };

    const openZonesModal = (c: Carrier) => {
        setSelectedCarrier(c);
        setZoneSelection(new Set(c.operatingZoneIds ?? []));
        setZonesModalOpen(true);
    };

    const toggleZone = (id: number) => {
        setZoneSelection((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const saveZones = async () => {
        if (!selectedCarrier) return;
        try {
            await carrierApi.updateZones(selectedCarrier.id, [...zoneSelection]);
            setZonesModalOpen(false);
            fetchCarriers();
        } catch (error) {
            console.error('Failed to update carrier zones:', error);
        }
    };

    const columns: Column<Carrier>[] = [
        { key: 'name', header: 'Tên carrier', render: (c) => <span className="font-medium">{c.name}</span> },
        { key: 'organization', header: 'Tổ chức', render: (c) => c.organization?.name ?? `#${c.organizationId}` },
        {
            key: 'operatingZoneIds',
            header: 'Khu vực hoạt động',
            render: (c) => (
                <div className="flex flex-wrap gap-1">
                    {(c.operatingZoneIds ?? []).length === 0 ? (
                        <span className="text-slate-400 text-sm">Chưa gán</span>
                    ) : (
                        (c.operatingZoneIds ?? []).map((zId) => (
                            <Badge key={zId} variant="info" className="text-xs">{zoneName(zId)}</Badge>
                        ))
                    )}
                </div>
            ),
        },
        { key: 'isActive', header: 'Trạng thái', render: (c) => <Badge variant={c.isActive ? 'success' : 'error'}>{c.isActive ? 'Hoạt động' : 'Ngưng'}</Badge> },
        {
            key: 'actions',
            header: '',
            render: (c) => (
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openZonesModal(c)} title="Gán khu vực">
                        <MapPin size={16} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(c)}>
                        <Edit size={16} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedCarrier(c)}>
                        <Eye size={16} />
                    </Button>
                </div>
            ),
        },
    ];

    const filtered = carriers.filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const stats = {
        total: carriers.length,
        active: carriers.filter((c) => c.isActive).length,
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Carriers</h1>
                    <p className="text-slate-500 mt-1">Quản lý doanh nghiệp last-mile đăng ký dùng nền tảng</p>
                </div>
                <Button onClick={() => { resetForm(); setEditingCarrier(null); setIsModalOpen(true); }}>
                    <Plus size={18} className="mr-1" />
                    Thêm carrier
                </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Card>
                    <CardBody className="flex items-center gap-3">
                        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl">
                            <Truck size={24} className="text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.total}</p>
                            <p className="text-sm text-slate-500">Tổng carrier</p>
                        </div>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="flex items-center gap-3">
                        <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-xl">
                            <Truck size={24} className="text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.active}</p>
                            <p className="text-sm text-slate-500">Đang hoạt động</p>
                        </div>
                    </CardBody>
                </Card>
            </div>

            <Card>
                <CardBody>
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <Input placeholder="Tìm tên carrier..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
                    </div>
                </CardBody>
            </Card>

            <Card>
                <CardHeader>
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Danh sách carrier</h2>
                </CardHeader>
                <CardBody>
                    <DataTable
                        columns={columns}
                        data={filtered}
                        loading={loading}
                        emptyMessage="Chưa có carrier nào đăng ký"
                        pagination={{ page, totalPages, onPageChange: setPage }}
                    />
                </CardBody>
            </Card>

            {/* Create/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingCarrier(null); }}
                title={editingCarrier ? 'Chỉnh sửa carrier' : 'Thêm carrier mới'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tổ chức *</label>
                        <select
                            value={formData.organizationId}
                            onChange={(e) => setFormData({ ...formData, organizationId: e.target.value })}
                            required
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                        >
                            <option value="">Chọn tổ chức...</option>
                            {organizations.map((o) => (
                                <option key={o.id} value={o.id}>{o.name}</option>
                            ))}
                        </select>
                    </div>
                    <Input
                        label="Tên carrier *"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        placeholder="VD: FastShip Cầu Giấy"
                    />
                    <Input
                        label="Người liên hệ"
                        value={formData.contactName}
                        onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-3">
                        <Input
                            label="SĐT liên hệ"
                            value={formData.contactPhone}
                            onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                        />
                        <Input
                            label="Email liên hệ"
                            value={formData.contactEmail}
                            onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Hủy</Button>
                        <Button type="submit">{editingCarrier ? 'Cập nhật' : 'Thêm carrier'}</Button>
                    </div>
                </form>
            </Modal>

            {/* Zones assignment Modal */}
            <Modal
                isOpen={zonesModalOpen}
                onClose={() => setZonesModalOpen(false)}
                title={`Khu vực hoạt động — ${selectedCarrier?.name ?? ''}`}
            >
                <div className="space-y-3">
                    <p className="text-sm text-slate-500">Chọn các khu vực (quận) carrier được phép hoạt động last-mile:</p>
                    <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto">
                        {zones.map((z) => (
                            <label key={z.id} className="flex items-center gap-2 rounded-lg border border-slate-200 p-2.5 cursor-pointer hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-700/50">
                                <input type="checkbox" checked={zoneSelection.has(z.id)} onChange={() => toggleZone(z.id)} />
                                <span className="text-sm">{z.name}</span>
                            </label>
                        ))}
                    </div>
                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button variant="outline" onClick={() => setZonesModalOpen(false)}>Hủy</Button>
                        <Button onClick={saveZones}>Lưu khu vực</Button>
                    </div>
                </div>
            </Modal>

            {/* Detail Modal */}
            <Modal isOpen={!!selectedCarrier && !zonesModalOpen} onClose={() => setSelectedCarrier(null)} title="Chi tiết carrier">
                {selectedCarrier && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-indigo-500 rounded-xl flex items-center justify-center text-white"><Building2 size={28} /></div>
                            <div>
                                <h3 className="text-lg font-semibold">{selectedCarrier.name}</h3>
                                <Badge variant={selectedCarrier.isActive ? 'success' : 'error'}>{selectedCarrier.isActive ? 'Hoạt động' : 'Ngưng'}</Badge>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                            <div><p className="text-sm text-slate-500">Tổ chức</p><p className="font-medium">{selectedCarrier.organization?.name ?? '-'}</p></div>
                            <div><p className="text-sm text-slate-500">Loại hình</p><p className="font-medium">Last-mile nội đô</p></div>
                            <div><p className="text-sm text-slate-500">Người liên hệ</p><p className="font-medium">{selectedCarrier.contactName || '-'}</p></div>
                            <div><p className="text-sm text-slate-500">SĐT</p><p className="font-medium">{selectedCarrier.contactPhone || '-'}</p></div>
                        </div>
                        <div className="flex justify-end pt-4 border-t"><Button onClick={() => setSelectedCarrier(null)}>Đóng</Button></div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
