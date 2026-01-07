'use client';

import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, DataTable, Badge, Button, Input, Modal } from '@/components/ui';
import { carrierApi } from '@/lib/api';
import { Carrier } from '@/types';
import { Truck, Search, Eye, Building2 } from 'lucide-react';
import type { Column } from '@/components/ui';

export default function RegulatorCarriersPage() {
    const [carriers, setCarriers] = useState<Carrier[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCarrier, setSelectedCarrier] = useState<Carrier | null>(null);

    useEffect(() => {
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
        fetchCarriers();
    }, [page]);

    const columns: Column<Carrier>[] = [
        { key: 'name', header: 'Tên đơn vị', render: (c) => <span className="font-medium">{c.name}</span> },
        { key: 'scale', header: 'Quy mô' },
        { key: 'vehicleCount', header: 'Số xe', render: (c) => c.vehicleCount || '-' },
        { key: 'warehouseCount', header: 'Số kho', render: (c) => c.warehouseCount || '-' },
        { key: 'isActive', header: 'Trạng thái', render: (c) => <Badge variant={c.isActive ? 'success' : 'error'}>{c.isActive ? 'Hoạt động' : 'Ngưng'}</Badge> },
        { key: 'actions', header: '', render: (c) => <Button variant="ghost" size="sm" onClick={() => setSelectedCarrier(c)}><Eye size={16} /></Button> },
    ];

    const filtered = carriers.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Đơn vị vận tải</h1>
                <p className="text-gray-500 mt-1">Danh sách các công ty vận tải đăng ký</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Card><CardBody className="flex items-center gap-3"><div className="p-3 bg-blue-100 rounded-xl"><Truck size={24} className="text-blue-600" /></div><div><p className="text-2xl font-bold">{carriers.length}</p><p className="text-sm text-gray-500">Tổng đơn vị</p></div></CardBody></Card>
                <Card><CardBody className="flex items-center gap-3"><div className="p-3 bg-green-100 rounded-xl"><Truck size={24} className="text-green-600" /></div><div><p className="text-2xl font-bold">{carriers.filter(c => c.isActive).length}</p><p className="text-sm text-gray-500">Đang hoạt động</p></div></CardBody></Card>
            </div>

            <Card><CardBody><div className="relative max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><Input placeholder="Tìm tên..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" /></div></CardBody></Card>

            <Card><CardHeader><h2 className="text-lg font-semibold">Danh sách đơn vị</h2></CardHeader><CardBody><DataTable columns={columns} data={filtered} loading={loading} emptyMessage="Chưa có đơn vị" pagination={{ page, totalPages, onPageChange: setPage }} /></CardBody></Card>

            <Modal isOpen={!!selectedCarrier} onClose={() => setSelectedCarrier(null)} title="Chi tiết đơn vị">
                {selectedCarrier && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-blue-500 rounded-xl flex items-center justify-center text-white"><Building2 size={28} /></div>
                            <div><h3 className="text-lg font-semibold">{selectedCarrier.name}</h3><Badge variant={selectedCarrier.isActive ? 'success' : 'error'}>{selectedCarrier.isActive ? 'Hoạt động' : 'Ngưng'}</Badge></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                            <div><p className="text-sm text-gray-500">Quy mô</p><p className="font-medium">{selectedCarrier.scale || '-'}</p></div>
                            <div><p className="text-sm text-gray-500">Số xe</p><p className="font-medium">{selectedCarrier.vehicleCount || 0}</p></div>
                            <div><p className="text-sm text-gray-500">Số kho</p><p className="font-medium">{selectedCarrier.warehouseCount || 0}</p></div>
                            <div><p className="text-sm text-gray-500">Liên hệ</p><p className="font-medium">{selectedCarrier.contactPhone || '-'}</p></div>
                        </div>
                        <div className="flex justify-end pt-4 border-t"><Button onClick={() => setSelectedCarrier(null)}>Đóng</Button></div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
