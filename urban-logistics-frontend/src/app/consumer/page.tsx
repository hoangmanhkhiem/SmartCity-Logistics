'use client';

import { Card, CardBody, CardHeader } from '@/components/ui';
import { MapPin, Package, Building2, Truck } from 'lucide-react';
import Link from 'next/link';

export default function ConsumerDashboard() {
    const quickActions = [
        { title: 'Xem bản đồ', desc: 'Tra cứu điểm giao nhận', icon: <MapPin size={24} />, href: '/consumer', color: 'bg-blue-500' },
        { title: 'Đơn hàng', desc: 'Theo dõi đơn hàng', icon: <Package size={24} />, href: '/consumer/orders', color: 'bg-green-500' },
        { title: 'Tìm cơ sở', desc: 'Hub, trạm sạc, trạm xăng', icon: <Building2 size={24} />, href: '/consumer/search', color: 'bg-purple-500' },
        { title: 'Theo dõi xe', desc: 'Vị trí xe vận chuyển', icon: <Truck size={24} />, href: '/consumer/tracking', color: 'bg-orange-500' },
    ];

    return (
        <div className="space-y-6">
            {/* Welcome */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
                <h1 className="text-2xl font-bold">Chào mừng đến Urban Logistics! 👋</h1>
                <p className="mt-2 text-blue-100">Theo dõi đơn hàng và tìm kiếm điểm giao nhận gần bạn.</p>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {quickActions.map((item) => (
                    <Link key={item.href} href={item.href}>
                        <Card hover className="h-full cursor-pointer">
                            <CardBody className="flex items-center gap-4">
                                <div className={`${item.color} p-3 rounded-xl text-white`}>
                                    {item.icon}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-800 dark:text-white">{item.title}</h3>
                                    <p className="text-sm text-gray-500">{item.desc}</p>
                                </div>
                            </CardBody>
                        </Card>
                    </Link>
                ))}
            </div>

            {/* Map placeholder */}
            <Card>
                <CardHeader>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Bản đồ điểm giao nhận</h2>
                </CardHeader>
                <CardBody>
                    <div className="h-96 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                        <div className="text-center text-gray-500">
                            <MapPin size={48} className="mx-auto mb-2 opacity-50" />
                            <p>Bản đồ sẽ hiển thị ở đây</p>
                            <p className="text-sm">Sử dụng Leaflet/OpenStreetMap</p>
                        </div>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
}
