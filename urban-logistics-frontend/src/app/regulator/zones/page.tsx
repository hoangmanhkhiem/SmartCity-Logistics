'use client';

import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, DataTable, Badge, Select, Button, Input, Modal } from '@/components/ui';
import { zoneApi } from '@/lib/api';
import { Zone } from '@/types';
import { MapPin, Plus, Search, Edit, Trash2 } from 'lucide-react';
import type { Column } from '@/components/ui';

const typeOptions = [
    { value: '', label: 'Tất cả loại' },
    { value: 'low_emission', label: 'Low Emission Zone' },
    { value: 'restricted', label: 'Vùng hạn chế' },
    { value: 'delivery', label: 'Vùng giao hàng' },
];

export default function RegulatorZonesPage() {
    const [zones, setZones] = useState<Zone[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [typeFilter, setTypeFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingZone, setEditingZone] = useState<Zone | null>(null);
    const [formData, setFormData] = useState({ name: '', type: 'low_emission', description: '' });

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingZone) await zoneApi.update(editingZone.id, formData);
            else await zoneApi.create(formData);
            setIsModalOpen(false);
            setEditingZone(null);
            setFormData({ name: '', type: 'low_emission', description: '' });
            fetchZones();
        } catch (error) {
            console.error('Failed to save zone:', error);
        }
    };

    const handleEdit = (zone: Zone) => {
        setEditingZone(zone);
        setFormData({ name: zone.name, type: zone.type || 'low_emission', description: zone.description || '' });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Xóa vùng này?')) {
            try { await zoneApi.delete(id); fetchZones(); } catch (e) { console.error(e); }
        }
    };

    const columns: Column<Zone>[] = [
        { key: 'name', header: 'Tên vùng' },
        { key: 'type', header: 'Loại', render: (z) => typeOptions.find(t => t.value === z.type)?.label || z.type || '-' },
        { key: 'description', header: 'Mô tả' },
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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Quản lý vùng</h1>
                    <p className="text-gray-500 mt-1">LEZ, vùng hạn chế và phân vùng giao hàng</p>
                </div>
                <Button onClick={() => { setFormData({ name: '', type: 'low_emission', description: '' }); setEditingZone(null); setIsModalOpen(true); }}>
                    <Plus size={18} className="mr-1" />Thêm vùng
                </Button>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <Card><CardBody className="flex items-center gap-3"><div className="p-3 bg-blue-100 rounded-xl"><MapPin size={24} className="text-blue-600" /></div><div><p className="text-2xl font-bold">{zones.length}</p><p className="text-sm text-gray-500">Tổng vùng</p></div></CardBody></Card>
                <Card><CardBody className="flex items-center gap-3"><div className="p-3 bg-green-100 rounded-xl"><MapPin size={24} className="text-green-600" /></div><div><p className="text-2xl font-bold">{zones.filter(z => z.isActive).length}</p><p className="text-sm text-gray-500">Hoạt động</p></div></CardBody></Card>
                <Card><CardBody className="flex items-center gap-3"><div className="p-3 bg-purple-100 rounded-xl"><MapPin size={24} className="text-purple-600" /></div><div><p className="text-2xl font-bold">{zones.filter(z => z.type === 'low_emission').length}</p><p className="text-sm text-gray-500">LEZ</p></div></CardBody></Card>
            </div>

            <Card><CardBody className="flex gap-4">
                <div className="flex-1 relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><Input placeholder="Tìm..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" /></div>
                <div className="w-48"><Select options={typeOptions} value={typeFilter} onChange={setTypeFilter} /></div>
            </CardBody></Card>

            <Card><CardHeader><h2 className="text-lg font-semibold">Danh sách vùng</h2></CardHeader><CardBody>
                <DataTable columns={columns} data={zones.filter(z => z.name.toLowerCase().includes(searchQuery.toLowerCase()))} loading={loading} emptyMessage="Chưa có vùng" pagination={{ page, totalPages, onPageChange: setPage }} />
            </CardBody></Card>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingZone ? 'Sửa vùng' : 'Thêm vùng'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input label="Tên *" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                    <Select label="Loại" options={typeOptions.slice(1)} value={formData.type} onChange={(v) => setFormData({ ...formData, type: v })} />
                    <Input label="Mô tả" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                    <div className="flex justify-end gap-2 pt-4 border-t"><Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Hủy</Button><Button type="submit">{editingZone ? 'Cập nhật' : 'Thêm'}</Button></div>
                </form>
            </Modal>
        </div>
    );
}
