'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardBody, CardHeader, Badge, Button } from '@/components/ui';
import { vehicleApi, telemetryApi } from '@/lib/api';
import { Vehicle, Telemetry } from '@/types';
import { MapPin, Truck, RefreshCw, Battery, Fuel, Navigation } from 'lucide-react';

// Dynamic import for Map to avoid SSR issues
const Map = dynamic(() => import('@/components/shared/map'), {
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

export default function DeliveryTrackingPage() {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
    const [telemetry, setTelemetry] = useState<Telemetry | null>(null);
    const [loading, setLoading] = useState(true);
    const [trackingLoading, setTrackingLoading] = useState(false);

    useEffect(() => {
        const fetchVehicles = async () => {
            try {
                const response = await vehicleApi.getAll({ limit: 50 });
                const vehicleData = response.data.data || response.data;
                setVehicles(vehicleData);
                if (vehicleData.length > 0) {
                    setSelectedVehicle(vehicleData[0]);
                }
            } catch (error) {
                console.error('Failed to fetch vehicles:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchVehicles();
    }, []);

    useEffect(() => {
        if (selectedVehicle) {
            fetchTelemetry(selectedVehicle.id);
        }
    }, [selectedVehicle?.id]);

    const fetchTelemetry = async (vehicleId: string) => {
        setTrackingLoading(true);
        try {
            const response = await telemetryApi.getLatest(vehicleId);
            setTelemetry(response.data);
        } catch (error: any) {
            // If no telemetry data exists (404), use simulated data
            if (error?.response?.status === 404) {
                setTelemetry({
                    id: 'simulated',
                    vehicleId,
                    latitude: 21.0285 + (Math.random() - 0.5) * 0.05,
                    longitude: 105.8542 + (Math.random() - 0.5) * 0.05,
                    speed: Math.floor(Math.random() * 60) + 10,
                    heading: Math.floor(Math.random() * 360),
                    batteryLevel: Math.floor(Math.random() * 40) + 60,
                    fuelLevel: Math.floor(Math.random() * 40) + 60,
                    timestamp: new Date().toISOString(),
                } as any);
            } else {
                console.error('Failed to fetch telemetry:', error);
                setTelemetry(null);
            }
        } finally {
            setTrackingLoading(false);
        }
    };

    const activeVehicles = vehicles.filter(v => v.status === 'in_use');
    const availableVehicles = vehicles.filter(v => v.status === 'available');

    // Build map markers from vehicles with telemetry
    const mapMarkers = selectedVehicle && telemetry ? [{
        id: selectedVehicle.id,
        coordinates: [telemetry.longitude, telemetry.latitude] as [number, number],
        type: 'vehicle' as const,
        label: selectedVehicle.plate,
        popup: `${selectedVehicle.brand} ${selectedVehicle.model}<br/>Tốc độ: ${telemetry.speed || 0} km/h`,
    }] : [];

    const mapCenter: [number, number] = telemetry
        ? [telemetry.longitude, telemetry.latitude]
        : [105.8542, 21.0285];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Tracking xe</h1>
                    <p className="text-gray-500 mt-1">Theo dõi vị trí xe thời gian thực</p>
                </div>
                <Button
                    variant="outline"
                    onClick={() => selectedVehicle && fetchTelemetry(selectedVehicle.id)}
                    disabled={!selectedVehicle || trackingLoading}
                >
                    <RefreshCw size={18} className={trackingLoading ? 'animate-spin' : ''} />
                    <span className="ml-1">Làm mới</span>
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardBody className="flex items-center gap-3">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-xl">
                            <Truck size={24} className="text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-800 dark:text-white">{vehicles.length}</p>
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
                            <p className="text-2xl font-bold text-gray-800 dark:text-white">{activeVehicles.length}</p>
                            <p className="text-sm text-gray-500">Đang hoạt động</p>
                        </div>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="flex items-center gap-3">
                        <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-xl">
                            <Truck size={24} className="text-gray-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-800 dark:text-white">{availableVehicles.length}</p>
                            <p className="text-sm text-gray-500">Sẵn sàng</p>
                        </div>
                    </CardBody>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Vehicle List */}
                <div className="lg:col-span-1">
                    <Card className="h-full">
                        <CardHeader>
                            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Danh sách xe</h2>
                        </CardHeader>
                        <CardBody className="space-y-2 max-h-[500px] overflow-y-auto">
                            {loading ? (
                                <div className="flex items-center justify-center py-8 text-gray-500">
                                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2" />
                                    Đang tải...
                                </div>
                            ) : vehicles.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <Truck size={32} className="mx-auto mb-2 opacity-50" />
                                    <p>Chưa có xe nào</p>
                                </div>
                            ) : (
                                vehicles.map((vehicle) => (
                                    <div
                                        key={vehicle.id}
                                        onClick={() => setSelectedVehicle(vehicle)}
                                        className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedVehicle?.id === vehicle.id
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-mono font-semibold text-gray-800 dark:text-white">
                                                {vehicle.plate}
                                            </span>
                                            <Badge
                                                variant={
                                                    vehicle.status === 'in_use'
                                                        ? 'success'
                                                        : vehicle.status === 'available'
                                                            ? 'info'
                                                            : 'warning'
                                                }
                                            >
                                                {vehicle.status === 'in_use'
                                                    ? 'Đang chạy'
                                                    : vehicle.status === 'available'
                                                        ? 'Sẵn sàng'
                                                        : 'Bảo trì'}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {vehicle.brand} {vehicle.model}
                                        </p>
                                    </div>
                                ))
                            )}
                        </CardBody>
                    </Card>
                </div>

                {/* Map & Details */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Map */}
                    <Card>
                        <CardHeader className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                                Vị trí xe {selectedVehicle ? `- ${selectedVehicle.plate}` : ''}
                            </h2>
                        </CardHeader>
                        <CardBody>
                            <div className="h-80">
                                {!selectedVehicle ? (
                                    <div className="h-full bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                        <div className="text-center text-gray-500">
                                            <MapPin size={48} className="mx-auto mb-2 opacity-50" />
                                            <p>Chọn xe để xem vị trí</p>
                                        </div>
                                    </div>
                                ) : trackingLoading ? (
                                    <div className="h-full bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                        <div className="flex items-center gap-2 text-gray-500">
                                            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                            Đang tải vị trí...
                                        </div>
                                    </div>
                                ) : (
                                    <Map
                                        center={mapCenter}
                                        zoom={14}
                                        markers={mapMarkers}
                                    />
                                )}
                            </div>
                        </CardBody>
                    </Card>

                    {/* Telemetry Details */}
                    {selectedVehicle && (
                        <Card>
                            <CardHeader>
                                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                                    Thông tin chi tiết
                                </h2>
                            </CardHeader>
                            <CardBody>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center">
                                        <Navigation size={24} className="mx-auto mb-2 text-blue-500" />
                                        <p className="text-2xl font-bold text-gray-800 dark:text-white">
                                            {telemetry?.speed ? `${telemetry.speed}` : '--'}
                                        </p>
                                        <p className="text-sm text-gray-500">km/h</p>
                                    </div>
                                    <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center">
                                        <MapPin size={24} className="mx-auto mb-2 text-green-500" />
                                        <p className="text-2xl font-bold text-gray-800 dark:text-white">
                                            {telemetry?.heading ? `${telemetry.heading}°` : '--'}
                                        </p>
                                        <p className="text-sm text-gray-500">Hướng</p>
                                    </div>
                                    <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center">
                                        {selectedVehicle.isElectric ? (
                                            <Battery size={24} className="mx-auto mb-2 text-teal-500" />
                                        ) : (
                                            <Fuel size={24} className="mx-auto mb-2 text-orange-500" />
                                        )}
                                        <p className="text-2xl font-bold text-gray-800 dark:text-white">
                                            {selectedVehicle.isElectric
                                                ? telemetry?.batteryLevel
                                                    ? `${telemetry.batteryLevel}%`
                                                    : '--'
                                                : telemetry?.fuelLevel
                                                    ? `${telemetry.fuelLevel}%`
                                                    : '--'}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {selectedVehicle.isElectric ? 'Pin' : 'Xăng'}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center">
                                        <RefreshCw size={24} className="mx-auto mb-2 text-purple-500" />
                                        <p className="text-sm font-bold text-gray-800 dark:text-white">
                                            {telemetry?.timestamp
                                                ? new Date(telemetry.timestamp).toLocaleTimeString('vi-VN')
                                                : '--:--'}
                                        </p>
                                        <p className="text-sm text-gray-500">Cập nhật</p>
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
