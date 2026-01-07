'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardBody, CardHeader } from '@/components/ui';
import { MapPin, Package, Building2, Truck } from 'lucide-react';
import Link from 'next/link';
import { facilityApi } from '@/lib/api';
import { Facility } from '@/types';

// Dynamic import for Map to avoid SSR issues
const Map = dynamic(() => import('@/components/shared/map'), {
    ssr: false,
    loading: () => (
        <div className="h-96 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
            <div className="flex items-center gap-2 text-gray-500">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                Đang tải bản đồ...
            </div>
        </div>
    )
});

export default function ConsumerDashboard() {
    const [facilities, setFacilities] = useState<Facility[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFacilities = async () => {
            try {
                const response = await facilityApi.getAll({ limit: 50 });
                setFacilities(response.data.data || response.data);
            } catch (error) {
                console.error('Failed to fetch facilities:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchFacilities();
    }, []);

    const quickActions = [
        { title: 'Xem bản đồ', desc: 'Tra cứu điểm giao nhận', icon: <MapPin size={24} />, href: '/consumer', color: 'bg-blue-500' },
        { title: 'Đơn hàng', desc: 'Theo dõi đơn hàng', icon: <Package size={24} />, href: '/consumer/orders', color: 'bg-green-500' },
        { title: 'Tìm cơ sở', desc: 'Hub, trạm sạc, trạm xăng', icon: <Building2 size={24} />, href: '/consumer/search', color: 'bg-purple-500' },
        { title: 'Theo dõi xe', desc: 'Vị trí xe vận chuyển', icon: <Truck size={24} />, href: '/consumer/tracking', color: 'bg-orange-500' },
    ];

    // Build map markers from facilities
    const mapMarkers = facilities.map((facility) => ({
        id: facility.id,
        coordinates: [facility.longitude, facility.latitude] as [number, number],
        type: 'facility' as const,
        label: facility.name,
        popup: `${facility.kind}<br/>${facility.address || ''}`,
    }));

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

            {/* Map with facilities */}
            <Card>
                <CardHeader className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Bản đồ điểm giao nhận</h2>
                    <span className="text-sm text-gray-500">{facilities.length} điểm</span>
                </CardHeader>
                <CardBody>
                    <div className="h-96">
                        <Map
                            center={[105.8542, 21.0285]}
                            zoom={12}
                            markers={mapMarkers}
                        />
                    </div>
                    {/* Legend */}
                    <div className="mt-3 flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                            <span className="text-gray-600 dark:text-gray-400">Điểm giao nhận</span>
                        </div>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
}
