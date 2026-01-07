'use client';

import { Card, CardBody, CardHeader } from '@/components/ui';
import { Truck, Package, MapPin, Users, TrendingUp, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

export default function DeliveryDashboard() {
    const stats = [
        { label: 'Tổng đơn hàng hôm nay', value: '156', icon: <Package size={24} />, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { label: 'Đang vận chuyển', value: '42', icon: <Truck size={24} />, color: 'text-purple-500', bg: 'bg-purple-500/10' },
        { label: 'Hoàn thành', value: '98', icon: <CheckCircle size={24} />, color: 'text-green-500', bg: 'bg-green-500/10' },
        { label: 'Chờ xử lý', value: '16', icon: <Clock size={24} />, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    ];

    const fleetStatus = [
        { type: 'Xe máy', total: 120, active: 85, maintenance: 10 },
        { type: 'Xe tải nhỏ', total: 45, active: 32, maintenance: 5 },
        { type: 'Xe tải lớn', total: 20, active: 15, maintenance: 2 },
        { type: 'Xe điện', total: 30, active: 25, maintenance: 3 },
    ];

    const recentOrders = [
        { id: 'ORD-001', customer: 'Nguyễn Văn A', status: 'in_transit', address: 'Q. Ba Đình, Hà Nội' },
        { id: 'ORD-002', customer: 'Trần Thị B', status: 'pending', address: 'Q. Đống Đa, Hà Nội' },
        { id: 'ORD-003', customer: 'Lê Văn C', status: 'delivered', address: 'Q. Cầu Giấy, Hà Nội' },
        { id: 'ORD-004', customer: 'Phạm Thị D', status: 'in_transit', address: 'Q. Thanh Xuân, Hà Nội' },
    ];

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            pending: 'bg-yellow-100 text-yellow-700',
            in_transit: 'bg-blue-100 text-blue-700',
            delivered: 'bg-green-100 text-green-700',
        };
        const labels: Record<string, string> = {
            pending: 'Chờ xử lý',
            in_transit: 'Đang giao',
            delivered: 'Hoàn thành',
        };
        return <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>{labels[status]}</span>;
    };

    return (
        <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <Card key={i}>
                        <CardBody className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>{stat.icon}</div>
                            <div>
                                <p className="text-2xl font-bold text-gray-800 dark:text-white">{stat.value}</p>
                                <p className="text-sm text-gray-500">{stat.label}</p>
                            </div>
                        </CardBody>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Fleet Status */}
                <Card>
                    <CardHeader className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Tình trạng đội xe</h2>
                        <Truck size={20} className="text-gray-400" />
                    </CardHeader>
                    <CardBody>
                        <div className="space-y-4">
                            {fleetStatus.map((fleet, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <span className="text-gray-700 dark:text-gray-300">{fleet.type}</span>
                                    <div className="flex items-center gap-4 text-sm">
                                        <span className="text-green-600">{fleet.active} hoạt động</span>
                                        <span className="text-orange-600">{fleet.maintenance} bảo trì</span>
                                        <span className="text-gray-400">/ {fleet.total}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardBody>
                </Card>

                {/* Recent Orders */}
                <Card>
                    <CardHeader className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Đơn hàng gần đây</h2>
                        <Package size={20} className="text-gray-400" />
                    </CardHeader>
                    <CardBody>
                        <div className="space-y-3">
                            {recentOrders.map((order) => (
                                <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <div>
                                        <p className="font-medium text-gray-800 dark:text-white">{order.id}</p>
                                        <p className="text-sm text-gray-500">{order.customer}</p>
                                    </div>
                                    <div className="text-right">
                                        {getStatusBadge(order.status)}
                                        <p className="text-xs text-gray-400 mt-1">{order.address}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Map for tracking */}
            <Card>
                <CardHeader>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Theo dõi xe thời gian thực</h2>
                </CardHeader>
                <CardBody>
                    <div className="h-80 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                        <div className="text-center text-gray-500">
                            <MapPin size={48} className="mx-auto mb-2 opacity-50" />
                            <p>Bản đồ tracking xe</p>
                            <p className="text-sm">Hiển thị vị trí xe realtime</p>
                        </div>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
}
