'use client';

import { useState } from 'react';
import { Card, CardBody, CardHeader, Badge, Button, Select, Input } from '@/components/ui';
import { Settings, Clock, Truck, MapPin, AlertTriangle, Plus } from 'lucide-react';

export default function RegulatorRestrictionsPage() {
    const [restrictions] = useState([
        { id: '1', name: 'Cấm xe tải lớn ban ngày', zone: 'Hoàn Kiếm', type: 'time', hours: '6:00 - 22:00', vehicleType: 'large_truck', isActive: true },
        { id: '2', name: 'LEZ - Chỉ xe điện', zone: 'Ba Đình LEZ', type: 'emission', standard: 'Electric only', vehicleType: 'all', isActive: true },
        { id: '3', name: 'Giới hạn tải trọng', zone: 'Đống Đa', type: 'weight', maxWeight: '2.5 tấn', vehicleType: 'truck', isActive: true },
        { id: '4', name: 'Cấm xe máy giờ cao điểm', zone: 'Cầu Giấy', type: 'time', hours: '7:00 - 9:00, 17:00 - 19:00', vehicleType: 'motorcycle', isActive: false },
    ]);

    const typeColors: Record<string, string> = { time: 'bg-orange-500', emission: 'bg-green-500', weight: 'bg-blue-500' };
    const typeLabels: Record<string, string> = { time: 'Thời gian', emission: 'Khí thải', weight: 'Tải trọng' };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Quy định hạn chế</h1>
                    <p className="text-gray-500 mt-1">Quản lý quy định giao thông và môi trường</p>
                </div>
                <Button><Plus size={18} className="mr-1" />Thêm quy định</Button>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <Card><CardBody className="flex items-center gap-3"><div className="p-3 bg-orange-100 rounded-xl"><Clock size={24} className="text-orange-600" /></div><div><p className="text-2xl font-bold">{restrictions.filter(r => r.type === 'time').length}</p><p className="text-sm text-gray-500">Hạn chế giờ</p></div></CardBody></Card>
                <Card><CardBody className="flex items-center gap-3"><div className="p-3 bg-green-100 rounded-xl"><Settings size={24} className="text-green-600" /></div><div><p className="text-2xl font-bold">{restrictions.filter(r => r.type === 'emission').length}</p><p className="text-sm text-gray-500">Hạn chế khí thải</p></div></CardBody></Card>
                <Card><CardBody className="flex items-center gap-3"><div className="p-3 bg-blue-100 rounded-xl"><Truck size={24} className="text-blue-600" /></div><div><p className="text-2xl font-bold">{restrictions.filter(r => r.type === 'weight').length}</p><p className="text-sm text-gray-500">Hạn chế tải</p></div></CardBody></Card>
            </div>

            <Card>
                <CardHeader><h2 className="text-lg font-semibold">Danh sách quy định</h2></CardHeader>
                <CardBody className="space-y-3">
                    {restrictions.map((r) => (
                        <div key={r.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-10 ${typeColors[r.type]} rounded-full`}></div>
                                    <div>
                                        <h3 className="font-semibold text-gray-800 dark:text-white">{r.name}</h3>
                                        <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                                            <MapPin size={14} /> {r.zone}
                                            <span className="mx-1">•</span>
                                            <Badge variant="secondary">{typeLabels[r.type]}</Badge>
                                        </div>
                                    </div>
                                </div>
                                <Badge variant={r.isActive ? 'success' : 'warning'}>{r.isActive ? 'Hoạt động' : 'Tạm dừng'}</Badge>
                            </div>
                            <div className="mt-3 pl-5 flex gap-4 text-sm text-gray-600">
                                {r.hours && <span><Clock size={14} className="inline mr-1" />{r.hours}</span>}
                                {r.maxWeight && <span><Truck size={14} className="inline mr-1" />Max: {r.maxWeight}</span>}
                                {r.standard && <span><AlertTriangle size={14} className="inline mr-1" />{r.standard}</span>}
                            </div>
                        </div>
                    ))}
                </CardBody>
            </Card>
        </div>
    );
}
