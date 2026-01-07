'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardBody, CardHeader } from '@/components/ui';
import { Truck, Leaf, AlertTriangle, TrendingDown, MapPin, BarChart3 } from 'lucide-react';
import { zoneApi, vehicleApi } from '@/lib/api';
import { Zone, Vehicle } from '@/types';

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

export default function RegulatorDashboard() {
    const [zones, setZones] = useState<Zone[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [vehiclePositions, setVehiclePositions] = useState<globalThis.Map<string, [number, number]>>(new globalThis.Map());

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [zoneRes, vehicleRes] = await Promise.all([
                    zoneApi.getAll({ limit: 50 }),
                    vehicleApi.getAll({ limit: 50 }),
                ]);
                setZones(zoneRes.data.data || zoneRes.data);
                const vehicleData = vehicleRes.data.data || vehicleRes.data;
                setVehicles(vehicleData);

                // Initialize positions
                const positions = new globalThis.Map<string, [number, number]>();
                vehicleData.forEach((v: Vehicle) => {
                    positions.set(v.id, [
                        105.8542 + (Math.random() - 0.5) * 0.06,
                        21.0285 + (Math.random() - 0.5) * 0.06
                    ]);
                });
                setVehiclePositions(positions);
            } catch (error) {
                console.error('Failed to fetch data:', error);
            }
        };
        fetchData();
    }, []);

    // Animate vehicles
    useEffect(() => {
        const interval = setInterval(() => {
            setVehiclePositions(prev => {
                const newPositions = new globalThis.Map(prev);
                vehicles.filter(v => v.status === 'in_use').forEach(v => {
                    const current = prev.get(v.id) || [105.8542, 21.0285];
                    newPositions.set(v.id, [
                        current[0] + (Math.random() - 0.5) * 0.002,
                        current[1] + (Math.random() - 0.5) * 0.002
                    ]);
                });
                return newPositions;
            });
        }, 2000);
        return () => clearInterval(interval);
    }, [vehicles]);

    const activeVehicles = vehicles.filter(v => v.status === 'in_use').length;
    const lezZones = zones.filter(z => z.type === 'lez').length;

    const kpis = [
        { label: 'Tổng đơn vị vận tải', value: String(vehicles.length), icon: <Truck size={24} />, color: 'text-blue-500', bg: 'bg-blue-500/10', change: '+5%' },
        { label: 'CO₂ tiết kiệm (tấn)', value: '1,250', icon: <Leaf size={24} />, color: 'text-green-500', bg: 'bg-green-500/10', change: '-12%' },
        { label: 'Vùng LEZ hoạt động', value: String(lezZones), icon: <MapPin size={24} />, color: 'text-purple-500', bg: 'bg-purple-500/10', change: '+2' },
        { label: 'Vi phạm tháng này', value: '23', icon: <AlertTriangle size={24} />, color: 'text-red-500', bg: 'bg-red-500/10', change: '-8%' },
    ];

    const topCarriers = [
        { name: 'GHN Express', vehicles: 120, compliance: 98, co2: 45 },
        { name: 'GHTK', vehicles: 95, compliance: 95, co2: 38 },
        { name: 'Shopee Express', vehicles: 80, compliance: 92, co2: 32 },
        { name: 'J&T Express', vehicles: 65, compliance: 89, co2: 28 },
    ];

    // Build map markers
    const mapMarkers = vehicles.map((vehicle) => {
        const position = vehiclePositions.get(vehicle.id) || [105.8542, 21.0285];
        return {
            id: vehicle.id,
            coordinates: position as [number, number],
            type: 'vehicle' as const,
            label: vehicle.plate,
            popup: `${vehicle.brand} ${vehicle.model}<br/>${vehicle.isElectric ? '⚡ Xe điện' : '⛽ Xe xăng'}`,
        };
    });

    return (
        <div className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map((kpi, i) => (
                    <Card key={i}>
                        <CardBody className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl ${kpi.bg} ${kpi.color}`}>{kpi.icon}</div>
                            <div className="flex-1">
                                <p className="text-2xl font-bold text-gray-800 dark:text-white">{kpi.value}</p>
                                <p className="text-sm text-gray-500">{kpi.label}</p>
                            </div>
                            <span className={`text-sm font-medium ${kpi.change.startsWith('-') ? 'text-green-500' : 'text-blue-500'}`}>
                                {kpi.change}
                            </span>
                        </CardBody>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Live Map */}
                <Card>
                    <CardHeader className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Giám sát xe thời gian thực</h2>
                            {activeVehicles > 0 && (
                                <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                    {activeVehicles} xe
                                </span>
                            )}
                        </div>
                    </CardHeader>
                    <CardBody>
                        <div className="h-64">
                            <MapView
                                center={[105.8542, 21.0285]}
                                zoom={11}
                                markers={mapMarkers}
                            />
                        </div>
                    </CardBody>
                </Card>

                {/* Top Carriers */}
                <Card>
                    <CardHeader>
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Đơn vị vận tải hàng đầu</h2>
                    </CardHeader>
                    <CardBody>
                        <div className="space-y-3">
                            {topCarriers.map((carrier, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                            {i + 1}
                                        </span>
                                        <div>
                                            <p className="font-medium text-gray-800 dark:text-white">{carrier.name}</p>
                                            <p className="text-sm text-gray-500">{carrier.vehicles} xe</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-green-600">{carrier.compliance}% tuân thủ</p>
                                        <p className="text-xs text-gray-400">{carrier.co2} tấn CO₂/tháng</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Active Zones with Map */}
            <Card>
                <CardHeader className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Vùng quản lý hoạt động</h2>
                    <span className="text-sm text-gray-500">{zones.length} vùng</span>
                </CardHeader>
                <CardBody>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {zones.slice(0, 6).map((zone, i) => (
                            <div key={i} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-medium text-gray-800 dark:text-white">{zone.name}</h3>
                                    <span className={`px-2 py-1 text-xs rounded-full ${zone.type === 'lez' ? 'bg-green-100 text-green-700' : zone.type === 'restricted' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {zone.type === 'lez' ? 'LEZ' : zone.type === 'restricted' ? 'Hạn chế' : 'Quận'}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500">{zone.description || zone.type}</p>
                            </div>
                        ))}
                    </div>
                </CardBody>
            </Card>
        </div>
    );
}
