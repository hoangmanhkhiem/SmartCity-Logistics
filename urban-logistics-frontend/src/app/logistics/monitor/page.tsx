'use client';

import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, Badge } from '@/components/ui';
import { MapPin, Truck, Activity, Navigation } from 'lucide-react';

interface Vehicle {
    id: string;
    name: string;
    driver: string;
    status: 'idle' | 'moving' | 'delivering';
    speed: number;
    location: string;
    orders: number;
}

export default function MonitorPage() {
    const [vehicles] = useState<Vehicle[]>([
        {
            id: '1',
            name: 'Xe 001',
            driver: 'Nguyễn Văn A',
            status: 'moving',
            speed: 45,
            location: 'Quận 1, TP.HCM',
            orders: 5,
        },
        {
            id: '2',
            name: 'Xe 002',
            driver: 'Trần Văn B',
            status: 'delivering',
            speed: 0,
            location: 'Quận 7, TP.HCM',
            orders: 3,
        },
        {
            id: '3',
            name: 'Xe 003',
            driver: 'Lê Thị C',
            status: 'idle',
            speed: 0,
            location: 'Gò Vấp, TP.HCM',
            orders: 0,
        },
    ]);

    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Giám sát Realtime</h1>
                    <p className="text-gray-500 mt-1">Theo dõi hoạt động giao hàng</p>
                </div>
                <div className="flex items-center gap-2">
                    <Activity size={20} className="text-green-500 animate-pulse" />
                    <span className="text-sm font-medium">Cập nhật: {time.toLocaleTimeString('vi-VN')}</span>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
                <Card>
                    <CardBody className="flex items-center gap-3">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-xl">
                            <Truck size={24} className="text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{vehicles.length}</p>
                            <p className="text-sm text-gray-500">Tổng xe</p>
                        </div>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="flex items-center gap-3">
                        <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-xl">
                            <Navigation size={24} className="text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{vehicles.filter(v => v.status === 'moving').length}</p>
                            <p className="text-sm text-gray-500">Đang di chuyển</p>
                        </div>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="flex items-center gap-3">
                        <div className="p-3 bg-orange-100 dark:bg-orange-900/50 rounded-xl">
                            <MapPin size={24} className="text-orange-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{vehicles.filter(v => v.status === 'delivering').length}</p>
                            <p className="text-sm text-gray-500">Đang giao hàng</p>
                        </div>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="flex items-center gap-3">
                        <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-xl">
                            <Truck size={24} className="text-gray-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{vehicles.filter(v => v.status === 'idle').length}</p>
                            <p className="text-sm text-gray-500">Rảnh rỗi</p>
                        </div>
                    </CardBody>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Bản đồ theo dõi</h2>
                </CardHeader>
                <CardBody>
                    <div className="h-96 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                        <p className="text-gray-500">Bản đồ giám sát realtime sẽ được hiển thị tại đây</p>
                    </div>
                </CardBody>
            </Card>

            <Card>
                <CardHeader>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Danh sách xe</h2>
                </CardHeader>
                <CardBody>
                    <div className="space-y-3">
                        {vehicles.map((vehicle) => (
                            <div key={vehicle.id} className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                                        <Truck size={24} className="text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium">{vehicle.name}</p>
                                        <p className="text-sm text-gray-500">Tài xế: {vehicle.driver}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <MapPin size={14} className="text-gray-400" />
                                            <span className="text-sm text-gray-600">{vehicle.location}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <p className="text-sm text-gray-500">Tốc độ</p>
                                        <p className="font-medium">{vehicle.speed} km/h</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-500">Đơn hàng</p>
                                        <p className="font-medium">{vehicle.orders}</p>
                                    </div>
                                    <Badge
                                        variant={
                                            vehicle.status === 'moving' ? 'default' :
                                            vehicle.status === 'delivering' ? 'warning' : 'success'
                                        }
                                    >
                                        {vehicle.status === 'moving' ? 'Di chuyển' :
                                         vehicle.status === 'delivering' ? 'Giao hàng' : 'Rảnh'}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardBody>
            </Card>
        </div>
    );
}
