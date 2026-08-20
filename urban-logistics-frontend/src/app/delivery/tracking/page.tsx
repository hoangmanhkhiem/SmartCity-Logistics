'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardBody, CardHeader, Badge, Button } from '@/components/ui';
import { vehicleApi, telemetryApi } from '@/lib/api';
import { useCurrentCarrier } from '@/lib/use-current-carrier';
import { ShipmentTrackingLookup } from '@/components/logistics/shipment-tracking-lookup';
import { Vehicle, Telemetry } from '@/types';
import { MapPin, Truck, RefreshCw, Battery, Fuel, Navigation } from 'lucide-react';
import { viStatus } from '@/lib/status-labels';

const Map = dynamic(() => import('@/components/shared/map'), {
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

const POLL_INTERVAL_MS = 15000;

export default function DeliveryTrackingPage() {
    const { carrier } = useCurrentCarrier();
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
    const [telemetry, setTelemetry] = useState<Telemetry | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (!carrier) return;
        vehicleApi.getAll({ carrierId: carrier.id, limit: 50 }).then((res) => {
            const vs: Vehicle[] = res.data.data ?? res.data;
            setVehicles(vs);
            if (vs.length > 0) setSelectedVehicle(vs[0]);
        }).catch((e) => console.error(e)).finally(() => setLoading(false));
    }, [carrier]);

    const fetchTelemetry = useCallback(async (vehicleId: number) => {
        try {
            const res = await telemetryApi.getLatest(vehicleId);
            setTelemetry(res.data);
        } catch {
            setTelemetry(null);
        }
    }, []);

    useEffect(() => {
        if (!selectedVehicle) return;
        fetchTelemetry(selectedVehicle.id);

        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = setInterval(() => fetchTelemetry(selectedVehicle.id), POLL_INTERVAL_MS);
        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, [selectedVehicle, fetchTelemetry]);

    const handleRefresh = async () => {
        if (!selectedVehicle) return;
        setRefreshing(true);
        await fetchTelemetry(selectedVehicle.id);
        setRefreshing(false);
    };

    const activeVehicles = vehicles.filter((v) => v.status === 'in_use');
    const availableVehicles = vehicles.filter((v) => v.status === 'available');

    const vehiclePosition: [number, number] | null =
        telemetry?.longitude != null && telemetry?.latitude != null ? [telemetry.longitude, telemetry.latitude] : null;

    const mapMarkers = selectedVehicle && vehiclePosition
        ? [{
            id: selectedVehicle.id,
            coordinates: vehiclePosition,
            type: 'vehicle' as const,
            label: selectedVehicle.plate,
            popup: `${selectedVehicle.brand ?? ''} ${selectedVehicle.model ?? ''}<br/>Tốc độ: ${telemetry?.speed ?? 0} km/h`,
        }]
        : [];

    const mapCenter: [number, number] = vehiclePosition ?? [105.8542, 21.0285];

    return (
        <div className="space-y-6">
            <ShipmentTrackingLookup
                title="Tra cứu vận đơn"
                description="Mã vận đơn (TRK…), mã đơn hàng, hoặc SĐT người nhận / người gửi (9 số cuối). API công khai, không cần đăng nhập riêng."
            />

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Giám sát xe</h1>
                    <p className="text-slate-500 mt-1">Vị trí xe theo dữ liệu GPS thực tế (telemetry)</p>
                </div>
                <Button variant="outline" onClick={handleRefresh} disabled={!selectedVehicle || refreshing}>
                    <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
                    <span className="ml-1">Làm mới</span>
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardBody className="flex items-center gap-3">
                        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl"><Truck size={24} className="text-indigo-600" /></div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800 dark:text-white">{vehicles.length}</p>
                            <p className="text-sm text-slate-500">Tổng xe</p>
                        </div>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="flex items-center gap-3">
                        <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-xl"><Navigation size={24} className="text-green-600" /></div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800 dark:text-white">{activeVehicles.length}</p>
                            <p className="text-sm text-slate-500">Đang hoạt động</p>
                        </div>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="flex items-center gap-3">
                        <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-xl"><Truck size={24} className="text-slate-600" /></div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800 dark:text-white">{availableVehicles.length}</p>
                            <p className="text-sm text-slate-500">Sẵn sàng</p>
                        </div>
                    </CardBody>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <Card className="h-full">
                        <CardHeader>
                            <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Danh sách xe</h2>
                        </CardHeader>
                        <CardBody className="space-y-2 max-h-[500px] overflow-y-auto">
                            {loading ? (
                                <div className="flex items-center justify-center py-8 text-slate-500">
                                    <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mr-2" />
                                    Đang tải...
                                </div>
                            ) : vehicles.length === 0 ? (
                                <div className="text-center py-8 text-slate-500">
                                    <Truck size={32} className="mx-auto mb-2 opacity-50" />
                                    <p>Chưa có xe nào</p>
                                </div>
                            ) : (
                                vehicles.map((vehicle) => (
                                    <div
                                        key={vehicle.id}
                                        onClick={() => setSelectedVehicle(vehicle)}
                                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                                            selectedVehicle?.id === vehicle.id
                                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                                : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-mono font-semibold text-slate-800 dark:text-white">{vehicle.plate}</span>
                                            <Badge variant={vehicle.status === 'in_use' ? 'success' : vehicle.status === 'available' ? 'info' : 'warning'}>
                                                {viStatus(vehicle.status)}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-slate-500 mt-1">{vehicle.brand} {vehicle.model}</p>
                                    </div>
                                ))
                            )}
                        </CardBody>
                    </Card>
                </div>

                <div className="lg:col-span-2 space-y-4">
                    <Card>
                        <CardHeader>
                            <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
                                Vị trí xe {selectedVehicle ? `- ${selectedVehicle.plate}` : ''}
                            </h2>
                        </CardHeader>
                        <CardBody>
                            <div className="h-96">
                                {!selectedVehicle ? (
                                    <div className="h-full bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                                        <div className="text-center text-slate-500">
                                            <MapPin size={48} className="mx-auto mb-2 opacity-50" />
                                            <p>Chọn xe để xem vị trí</p>
                                        </div>
                                    </div>
                                ) : !vehiclePosition ? (
                                    <div className="h-full bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                                        <div className="text-center text-slate-500">
                                            <MapPin size={48} className="mx-auto mb-2 opacity-50" />
                                            <p>Chưa có dữ liệu GPS (telemetry) cho xe này</p>
                                        </div>
                                    </div>
                                ) : (
                                    <Map center={mapCenter} zoom={14} markers={mapMarkers} showZonesAndRestrictions />
                                )}
                            </div>
                        </CardBody>
                    </Card>

                    {selectedVehicle && (
                        <Card>
                            <CardHeader>
                                <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Thông tin chi tiết</h2>
                            </CardHeader>
                            <CardBody>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg text-center">
                                        <Navigation size={24} className="mx-auto mb-2 text-indigo-500" />
                                        <p className="text-2xl font-bold text-slate-800 dark:text-white">{telemetry?.speed ?? '--'}</p>
                                        <p className="text-sm text-slate-500">km/h</p>
                                    </div>
                                    <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg text-center">
                                        <MapPin size={24} className="mx-auto mb-2 text-green-500" />
                                        <p className="text-2xl font-bold text-slate-800 dark:text-white">
                                            {telemetry?.heading != null ? `${Math.round(telemetry.heading)}°` : '--'}
                                        </p>
                                        <p className="text-sm text-slate-500">Hướng</p>
                                    </div>
                                    <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg text-center">
                                        {selectedVehicle.isElectric ? (
                                            <Battery size={24} className="mx-auto mb-2 text-teal-500" />
                                        ) : (
                                            <Fuel size={24} className="mx-auto mb-2 text-orange-500" />
                                        )}
                                        <p className="text-2xl font-bold text-slate-800 dark:text-white">
                                            {selectedVehicle.isElectric
                                                ? telemetry?.batteryLevel != null ? `${Math.round(telemetry.batteryLevel)}%` : '--'
                                                : telemetry?.fuelLevel != null ? `${Math.round(telemetry.fuelLevel)}%` : '--'}
                                        </p>
                                        <p className="text-sm text-slate-500">{selectedVehicle.isElectric ? 'Pin' : 'Xăng'}</p>
                                    </div>
                                    <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg text-center">
                                        <RefreshCw size={24} className="mx-auto mb-2 text-purple-500" />
                                        <p className="text-sm font-bold text-slate-800 dark:text-white">
                                            {telemetry?.timestamp ? new Date(telemetry.timestamp).toLocaleTimeString('vi-VN') : '--:--'}
                                        </p>
                                        <p className="text-sm text-slate-500">Cập nhật gần nhất</p>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
