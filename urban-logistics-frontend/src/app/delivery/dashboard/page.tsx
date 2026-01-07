'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardBody, CardHeader } from '@/components/ui';
import { Truck, Package, MapPin, CheckCircle, Clock } from 'lucide-react';
import { vehicleApi, facilityApi } from '@/lib/api';
import { Vehicle, Facility } from '@/types';

// Dynamic import for Map to avoid SSR issues
const MapView = dynamic(() => import('@/components/shared/map'), {
    ssr: false,
    loading: () => (
        <div className="h-80 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
            <div className="flex items-center gap-2 text-gray-500">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                Đang tải bản đồ...
            </div>
        </div>
    )
});

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1Ijoia2hpZW1obTA0IiwiYSI6ImNtazNnc216ajBkZHgzZ3EyaWJ3OGFrZ2QifQ.3EGQJyiXL-oU1l1Ug4qfTQ';

export default function DeliveryDashboard() {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [facilities, setFacilities] = useState<Facility[]>([]);
    const [vehicleRoutes, setVehicleRoutes] = useState<globalThis.Map<string, [number, number][]>>(new globalThis.Map());
    const [vehicleProgress, setVehicleProgress] = useState<globalThis.Map<string, number>>(new globalThis.Map());
    const [vehiclePositions, setVehiclePositions] = useState<globalThis.Map<string, [number, number]>>(new globalThis.Map());

    // Fetch initial data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [vehicleRes, facilityRes] = await Promise.all([
                    vehicleApi.getAll({ limit: 50 }),
                    facilityApi.getAll({ limit: 20 }),
                ]);
                const vehicleData = vehicleRes.data.data || vehicleRes.data;
                const facilityData = facilityRes.data.data || facilityRes.data;
                setVehicles(vehicleData);
                setFacilities(facilityData);

                // Fetch routes for in_use vehicles
                vehicleData.filter((v: Vehicle) => v.status === 'in_use').forEach((vehicle: Vehicle) => {
                    // Pick random start and end facilities
                    if (facilityData.length >= 2) {
                        const startFacility = facilityData[Math.floor(Math.random() * facilityData.length)];
                        let endFacility = facilityData[Math.floor(Math.random() * facilityData.length)];
                        while (endFacility.id === startFacility.id) {
                            endFacility = facilityData[Math.floor(Math.random() * facilityData.length)];
                        }
                        fetchRouteForVehicle(vehicle.id,
                            [startFacility.longitude, startFacility.latitude],
                            [endFacility.longitude, endFacility.latitude]
                        );
                    }
                });

                // Set static positions for non-active vehicles
                const positions = new globalThis.Map<string, [number, number]>();
                vehicleData.filter((v: Vehicle) => v.status !== 'in_use').forEach((v: Vehicle) => {
                    positions.set(v.id, [
                        105.8542 + (Math.random() - 0.5) * 0.04,
                        21.0285 + (Math.random() - 0.5) * 0.04
                    ]);
                });
                setVehiclePositions(positions);
            } catch (error) {
                console.error('Failed to fetch data:', error);
            }
        };
        fetchData();
    }, []);

    // Fetch route from Mapbox Directions API
    const fetchRouteForVehicle = useCallback(async (vehicleId: string, start: [number, number], end: [number, number]) => {
        try {
            const response = await fetch(
                `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson&access_token=${MAPBOX_TOKEN}`
            );
            const data = await response.json();

            if (data.routes && data.routes[0]) {
                const coordinates = data.routes[0].geometry.coordinates as [number, number][];
                setVehicleRoutes(prev => {
                    const newRoutes = new globalThis.Map(prev);
                    newRoutes.set(vehicleId, coordinates);
                    return newRoutes;
                });
                setVehicleProgress(prev => {
                    const newProgress = new globalThis.Map(prev);
                    newProgress.set(vehicleId, Math.random() * 0.3); // Random start position
                    return newProgress;
                });
            }
        } catch (error) {
            console.error('Failed to fetch route:', error);
        }
    }, []);

    // Animate vehicles along routes
    useEffect(() => {
        const interval = setInterval(() => {
            setVehicleProgress(prev => {
                const newProgress = new globalThis.Map(prev);
                prev.forEach((progress, vehicleId) => {
                    let newValue = progress + 0.0008 + Math.random() * 0.0005;
                    if (newValue >= 1) newValue = 0;
                    newProgress.set(vehicleId, newValue);
                });
                return newProgress;
            });
        }, 100);
        return () => clearInterval(interval);
    }, []);

    // Update vehicle positions based on progress
    useEffect(() => {
        const newPositions = new globalThis.Map(vehiclePositions);

        vehicleProgress.forEach((progress, vehicleId) => {
            const route = vehicleRoutes.get(vehicleId);
            if (!route || route.length === 0) return;

            const totalPoints = route.length - 1;
            const exactIndex = progress * totalPoints;
            const index = Math.floor(exactIndex);
            const fraction = exactIndex - index;

            const start = route[index];
            const end = route[Math.min(index + 1, route.length - 1)];

            if (start && end) {
                const newLng = start[0] + (end[0] - start[0]) * fraction;
                const newLat = start[1] + (end[1] - start[1]) * fraction;
                newPositions.set(vehicleId, [newLng, newLat]);
            }
        });

        setVehiclePositions(newPositions);
    }, [vehicleProgress, vehicleRoutes]);

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

    // Build map markers from vehicles
    const mapMarkers = vehicles.map((vehicle) => {
        const position = vehiclePositions.get(vehicle.id);
        if (!position) return null;
        return {
            id: vehicle.id,
            coordinates: position,
            type: 'vehicle' as const,
            label: vehicle.plate,
            popup: `${vehicle.brand} ${vehicle.model}<br/>${vehicle.status === 'in_use' ? '🟢 Đang chạy theo tuyến' : '⏸️ Dừng'}`,
        };
    }).filter(Boolean) as any[];

    const activeCount = vehicles.filter(v => v.status === 'in_use').length;

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

            {/* Live Map for tracking */}
            <Card>
                <CardHeader className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Theo dõi xe thời gian thực</h2>
                        {activeCount > 0 && (
                            <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                {activeCount} xe đang chạy theo tuyến
                            </span>
                        )}
                    </div>
                </CardHeader>
                <CardBody>
                    <div className="h-80">
                        <MapView
                            center={[105.8542, 21.0285]}
                            zoom={12}
                            markers={mapMarkers}
                        />
                    </div>
                </CardBody>
            </Card>
        </div>
    );
}
