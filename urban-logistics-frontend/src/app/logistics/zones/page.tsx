'use client';

import { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader, DataTable, Badge, Select, Button, Input, Modal } from '@/components/ui';
import { zoneApi } from '@/lib/api';
import { Zone } from '@/types';
import { MapPin, Plus, Search, Edit, Trash2, PenLine } from 'lucide-react';
import type { Column } from '@/components/ui';
import Map from '@/components/shared/map';

const typeOptions = [
    { value: '', label: 'Tất cả loại' },
    { value: 'low_emission', label: 'Low Emission Zone' },
    { value: 'restricted', label: 'Vùng hạn chế' },
    { value: 'delivery', label: 'Vùng giao hàng' },
];

export default function LogisticsZonesPage() {
    const [zones, setZones] = useState<Zone[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [typeFilter, setTypeFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingZone, setEditingZone] = useState<Zone | null>(null);
    const [formData, setFormData] = useState({ name: '', type: 'low_emission', description: '' });
    const [drawnPolygon, setDrawnPolygon] = useState<GeoJSON.Polygon | null>(null);

    const fetchZones = async () => {
        setLoading(true);
        try {
            const params: Record<string, unknown> = { page, limit: 10 };
            if (typeFilter) params.type = typeFilter;
            const response = await zoneApi.getAll(params);
            setZones(response.data.data || response.data);
            setTotalPages(response.data.meta?.totalPages || 1);
        } catch (error) {
            console.error('Failed to fetch zones:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchZones(); }, [page, typeFilter]);

    const handleDrawComplete = (feature: GeoJSON.Feature) => {
        if (feature.geometry.type === 'Polygon') {
            setDrawnPolygon(feature.geometry);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                ...(drawnPolygon && { boundary: JSON.stringify(drawnPolygon) }),
            };
            if (editingZone) await zoneApi.update(editingZone.id, payload);
            else await zoneApi.create(payload);
            setIsModalOpen(false);
            setEditingZone(null);
            setFormData({ name: '', type: 'low_emission', description: '' });
            setDrawnPolygon(null);
            fetchZones();
        } catch (error) {
            console.error('Failed to save zone:', error);
        }
    };

    const handleEdit = (zone: Zone) => {
        setEditingZone(zone);
        setFormData({ name: zone.name, type: zone.type || 'low_emission', description: zone.description || '' });
        try {
            setDrawnPolygon(zone.boundary ? (JSON.parse(zone.boundary) as GeoJSON.Polygon) : null);
        } catch {
            setDrawnPolygon(null);
        }
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (confirm('Xóa vùng này?')) {
            try { await zoneApi.delete(id); fetchZones(); } catch (e) { console.error(e); }
        }
    };

    const columns: Column<Zone>[] = [
        { key: 'name', header: 'Tên vùng' },
        { key: 'type', header: 'Loại', render: (z) => typeOptions.find(t => t.value === z.type)?.label || z.type || '-' },
        { key: 'description', header: 'Mô tả' },
        {
            key: 'boundary', header: 'Ranh giới', render: (z) => (
                <Badge variant={z.boundary ? 'success' : 'default'}>{z.boundary ? 'Đã vẽ' : 'Chưa vẽ'}</Badge>
            )
        },
        { key: 'isActive', header: 'Trạng thái', render: (z) => <Badge variant={z.isActive ? 'success' : 'error'}>{z.isActive ? 'Hoạt động' : 'Tắt'}</Badge> },
        {
            key: 'actions', header: '', render: (z) => (
                <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(z)}><Edit size={16} /></Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(z.id)}><Trash2 size={16} className="text-red-500" /></Button>
                </div>
            )
        },
    ];

    const filteredZones = zones.filter((z) => z.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Vùng & Zone</h1>
                    <p className="text-slate-500 mt-1">LEZ, vùng hạn chế và phân vùng giao hàng — vẽ trực tiếp trên bản đồ</p>
                </div>
                <Button onClick={() => { setFormData({ name: '', type: 'low_emission', description: '' }); setEditingZone(null); setDrawnPolygon(null); setIsModalOpen(true); }}>
                    <Plus size={18} className="mr-1" />Thêm vùng
                </Button>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <Card><CardBody className="flex items-center gap-3"><div className="p-3 bg-indigo-100 rounded-xl"><MapPin size={24} className="text-indigo-600" /></div><div><p className="text-2xl font-bold">{zones.length}</p><p className="text-sm text-slate-500">Tổng vùng</p></div></CardBody></Card>
                <Card><CardBody className="flex items-center gap-3"><div className="p-3 bg-green-100 rounded-xl"><MapPin size={24} className="text-green-600" /></div><div><p className="text-2xl font-bold">{zones.filter(z => z.isActive).length}</p><p className="text-sm text-slate-500">Hoạt động</p></div></CardBody></Card>
                <Card><CardBody className="flex items-center gap-3"><div className="p-3 bg-purple-100 rounded-xl"><MapPin size={24} className="text-purple-600" /></div><div><p className="text-2xl font-bold">{zones.filter(z => z.type === 'low_emission').length}</p><p className="text-sm text-slate-500">LEZ</p></div></CardBody></Card>
            </div>

            <Card><CardBody className="flex gap-4">
                <div className="flex-1 relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><Input placeholder="Tìm..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" /></div>
                <div className="w-48"><Select options={typeOptions} value={typeFilter} onChange={setTypeFilter} /></div>
            </CardBody></Card>

            <Card><CardHeader><h2 className="text-lg font-semibold">Danh sách vùng</h2></CardHeader><CardBody>
                <DataTable columns={columns} data={filteredZones} loading={loading} emptyMessage="Chưa có vùng" pagination={{ page, totalPages, onPageChange: setPage }} />
            </CardBody></Card>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingZone ? 'Sửa vùng' : 'Thêm vùng'} size="lg">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input label="Tên *" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                    <Select label="Loại" options={typeOptions.slice(1)} value={formData.type} onChange={(v) => setFormData({ ...formData, type: v })} />
                    <Input label="Mô tả" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                    <div>
                        <label className="mb-1 flex items-center gap-2 text-sm text-slate-600">
                            <PenLine size={16} />
                            Vẽ ranh giới vùng trên bản đồ (click nhiều điểm, double-click để khép vùng) {drawnPolygon ? '— đã vẽ' : '— chưa vẽ'}
                        </label>
                        <div className="h-[320px] w-full overflow-hidden rounded-lg border border-slate-300 dark:border-slate-600">
                            <Map
                                drawMode="polygon"
                                onDrawComplete={handleDrawComplete}
                                initialDrawFeature={drawnPolygon ? { type: 'Feature', properties: {}, geometry: drawnPolygon } : null}
                                zoom={12}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-4 border-t"><Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Hủy</Button><Button type="submit">{editingZone ? 'Cập nhật' : 'Thêm'}</Button></div>
                </form>
            </Modal>
        </div>
    );
}
