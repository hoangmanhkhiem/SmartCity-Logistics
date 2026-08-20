'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardBody, CardHeader, Badge } from '@/components/ui';
import { Truck, Package, CheckCircle, Clock } from 'lucide-react';
import { vehicleApi, orderApi, telemetryApi } from '@/lib/api';
import { useCurrentCarrier } from '@/lib/use-current-carrier';
import { Vehicle, Order, Telemetry } from '@/types';
import { viStatus } from '@/lib/status-labels';

const MapView = dynamic(() => import('@/components/shared/map'), {
    ssr: false,
    loading: () => (
        <div className="h-80 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
            <div className="flex items-center gap-2 text-slate-500">
                <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                Đang tải bản đồ...
            </div>
        </div>
    ),
});

export default function DeliveryDashboard() {
    const { carrier } = useCurrentCarrier();
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [positions, setPositions] = useState<Map<number, [number, number]>>(new Map());

    useEffect(() => {
        if (!carrier) return;
        vehicleApi.getAll({ carrierId: carrier.id, limit: 100 }).then((res) => {
            const vs: Vehicle[] = res.data.data ?? res.data;
            setVehicles(vs);

            Promise.all(
                vs
                    .filter((v) => v.status === 'in_use')
                    .map((v) =>
                        telemetryApi
                            .getLatest(v.id)
                            .then((r) => [v.id, r.data as Telemetry] as const)
                            .catch(() => null),
                    ),
            ).then((results) => {
                const next = new Map<number, [number, number]>();
                for (const r of results) {
                    if (!r) continue;
                    const [vehicleId, t] = r;
                    if (t?.longitude != null && t?.latitude != null) next.set(vehicleId, [t.longitude, t.latitude]);
                }
                setPositions(next);
            });
        }).catch((e) => console.error(e));

        orderApi.getAll({ carrierId: carrier.id, limit: 6 }).then((res) => setOrders(res.data.data ?? res.data)).catch((e) => console.error(e));
    }, [carrier]);

    const stats = [
        { label: 'Tổng đơn (gần đây)', value: orders.length, icon: <Package size={24} />, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
        { label: 'Xe đang chạy', value: vehicles.filter((v) => v.status === 'in_use').length, icon: <Truck size={24} />, color: 'text-purple-500', bg: 'bg-purple-500/10' },
        { label: 'Đã giao', value: orders.filter((o) => o.status === 'delivered').length, icon: <CheckCircle size={24} />, color: 'text-green-500', bg: 'bg-green-500/10' },
        { label: 'Chờ xử lý', value: orders.filter((o) => o.status === 'pending').length, icon: <Clock size={24} />, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    ];

    const fleetByType = Object.values(
        vehicles.reduce<Record<string, { type: string; total: number; active: number; maintenance: number }>>((acc, v) => {
            acc[v.type] ??= { type: v.type, total: 0, active: 0, maintenance: 0 };
            acc[v.type].total++;
            if (v.status === 'in_use') acc[v.type].active++;
            if (v.status === 'maintenance') acc[v.type].maintenance++;
            return acc;
        }, {}),
    );

    const mapMarkers = vehicles
        .map((vehicle) => {
            const position = positions.get(vehicle.id);
            if (!position) return null;
            return {
                id: vehicle.id,
                coordinates: position,
                type: 'vehicle' as const,
                label: vehicle.plate,
                popup: `${vehicle.brand ?? ''} ${vehicle.model ?? ''}<br/>🟢 Đang chạy (telemetry thật)`,
            };
        })
        .filter((m): m is NonNullable<typeof m> => m !== null);

    const activeCount = vehicles.filter((v) => v.status === 'in_use').length;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <Card key={i}>
                        <CardBody className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>{stat.icon}</div>
                            <div>
                                <p className="text-2xl font-bold text-slate-800 dark:text-white">{stat.value}</p>
                                <p className="text-sm text-slate-500">{stat.label}</p>
                            </div>
                        </CardBody>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Tình trạng đội xe</h2>
                        <Truck size={20} className="text-slate-400" />
                    </CardHeader>
                    <CardBody>
                        {fleetByType.length === 0 ? (
                            <p className="text-sm text-slate-500">Chưa có xe nào</p>
                        ) : (
                            <div className="space-y-4">
                                {fleetByType.map((fleet) => (
                                    <div key={fleet.type} className="flex items-center justify-between">
                                        <span className="text-slate-700 dark:text-slate-300">{fleet.type}</span>
                                        <div className="flex items-center gap-4 text-sm">
                                            <span className="text-green-600">{fleet.active} hoạt động</span>
                                            <span className="text-orange-600">{fleet.maintenance} bảo trì</span>
                                            <span className="text-slate-400">/ {fleet.total}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardBody>
                </Card>

                <Card>
                    <CardHeader className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Đơn hàng gần đây</h2>
                        <Package size={20} className="text-slate-400" />
                    </CardHeader>
                    <CardBody>
                        {orders.length === 0 ? (
                            <p className="text-sm text-slate-500">Chưa có đơn hàng</p>
                        ) : (
                            <div className="space-y-3">
                                {orders.map((order) => (
                                    <div key={order.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                        <div>
                                            <p className="font-medium text-slate-800 dark:text-white">{order.orderNumber}</p>
                                            <p className="text-sm text-slate-500">{order.deliveryPhone ?? '—'}</p>
                                        </div>
                                        <div className="text-right">
                                            <Badge variant="info">{viStatus(order.status)}</Badge>
                                            <p className="text-xs text-slate-400 mt-1 max-w-[180px] truncate">{order.deliveryAddress}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardBody>
                </Card>
            </div>

            <Card>
                <CardHeader className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Theo dõi xe thời gian thực</h2>
                        {activeCount > 0 && (
                            <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                {activeCount} xe đang chạy
                            </span>
                        )}
                    </div>
                </CardHeader>
                <CardBody>
                    <div className="h-80">
                        <MapView center={[105.8542, 21.0285]} zoom={12} markers={mapMarkers} showZonesAndRestrictions />
                    </div>
                    {mapMarkers.length === 0 && (
                        <p className="text-sm text-slate-500 mt-2">Chưa có dữ liệu telemetry cho xe đang chạy.</p>
                    )}
                </CardBody>
            </Card>
        </div>
    );
}
