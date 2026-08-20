'use client';

import { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader, DataTable, Badge, Select, Input, Modal } from '@/components/ui';
import { zoneApi } from '@/lib/api';
import { Zone } from '@/types';
import { MapPin, Search, Eye } from 'lucide-react';
import type { Column } from '@/components/ui';
import Map from '@/components/shared/map';

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
    const [viewingZone, setViewingZone] = useState<Zone | null>(null);

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

    let viewingPolygon: GeoJSON.Polygon | null = null;
    if (viewingZone?.boundary) {
        try {
            viewingPolygon = JSON.parse(viewingZone.boundary) as GeoJSON.Polygon;
        } catch {
            viewingPolygon = null;
        }
    }

    const columns: Column<Zone>[] = [
        { key: 'name', header: 'Tên vùng' },
        { key: 'type', header: 'Loại', render: (z) => typeOptions.find(t => t.value === z.type)?.label || z.type || '-' },
        { key: 'description', header: 'Mô tả' },
        { key: 'isActive', header: 'Trạng thái', render: (z) => <Badge variant={z.isActive ? 'success' : 'error'}>{z.isActive ? 'Hoạt động' : 'Tắt'}</Badge> },
        {
            key: 'actions', header: '', render: (z) => (
                <button
                    type="button"
                    onClick={() => setViewingZone(z)}
                    className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                    <Eye size={14} /> Xem
                </button>
            )
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Quản lý vùng</h1>
                <p className="text-slate-500 mt-1">LEZ, vùng hạn chế và phân vùng giao hàng — chỉ xem (Admin là nơi tạo/sửa)</p>
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
                <DataTable columns={columns} data={zones.filter(z => z.name.toLowerCase().includes(searchQuery.toLowerCase()))} loading={loading} emptyMessage="Chưa có vùng" pagination={{ page, totalPages, onPageChange: setPage }} />
            </CardBody></Card>

            <Modal isOpen={!!viewingZone} onClose={() => setViewingZone(null)} title={viewingZone ? `Ranh giới: ${viewingZone.name}` : ''} size="lg">
                {viewingPolygon ? (
                    <div className="h-[380px] w-full overflow-hidden rounded-lg border border-slate-300 dark:border-slate-600">
                        <Map drawMode="polygon" initialDrawFeature={{ type: 'Feature', properties: {}, geometry: viewingPolygon }} zoom={12} />
                    </div>
                ) : (
                    <p className="text-sm text-slate-500">Vùng này chưa có ranh giới được vẽ.</p>
                )}
            </Modal>
        </div>
    );
}
