'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardBody, CardHeader, Badge, Button } from '@/components/ui';
import { vehicleApi, facilityApi } from '@/lib/api';
import { Vehicle, Telemetry, Facility } from '@/types';
import { MapPin, Truck, RefreshCw, Battery, Fuel, Navigation, Play, Pause } from 'lucide-react';

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
    const [facilities, setFacilities] = useState<Facility[]>([]);
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
    const [telemetry, setTelemetry] = useState<Telemetry | null>(null);
    const [loading, setLoading] = useState(true);
    const [trackingLoading, setTrackingLoading] = useState(false);

    // Route animation state
    const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
    const [progress, setProgress] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const [vehiclePosition, setVehiclePosition] = useState<[number, number] | null>(null);
    const [routeDestination, setRouteDestination] = useState<Facility | null>(null);

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
                if (vehicleData.length > 0) {
                    setSelectedVehicle(vehicleData[0]);
                }
            } catch (error) {
                console.error('Failed to fetch data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Pick a random facility as destination when vehicle changes
    useEffect(() => {
        if (selectedVehicle && facilities.length > 0) {
            const randomFacility = facilities[Math.floor(Math.random() * facilities.length)];
            setRouteDestination(randomFacility);
            setProgress(0);
            setRouteCoordinates([]);
        }
    }, [selectedVehicle?.id, facilities]);

    // Handle route loaded from Map component
    const handleRouteLoaded = useCallback((coordinates: [number, number][]) => {
        setRouteCoordinates(coordinates);
        if (coordinates.length > 0) {
            setVehiclePosition(coordinates[0]);
        }
    }, []);

    // Animate vehicle along route
    useEffect(() => {
        if (!isPlaying || routeCoordinates.length === 0 || !selectedVehicle) return;
        if (selectedVehicle.status !== 'in_use') return;

        const interval = setInterval(() => {
            setProgress(prev => {
                const newProgress = prev + 0.001;
                if (newProgress >= 1) {
                    return 0;
                }
                return newProgress;
            });
        }, 100);

        return () => clearInterval(interval);
    }, [isPlaying, routeCoordinates.length, selectedVehicle]);

    // Update vehicle position based on progress
    useEffect(() => {
        if (routeCoordinates.length === 0) return;

        const totalPoints = routeCoordinates.length - 1;
        const exactIndex = progress * totalPoints;
        const index = Math.floor(exactIndex);
        const fraction = exactIndex - index;

        const start = routeCoordinates[index];
        const end = routeCoordinates[Math.min(index + 1, routeCoordinates.length - 1)];

        if (start && end) {
            const newLng = start[0] + (end[0] - start[0]) * fraction;
            const newLat = start[1] + (end[1] - start[1]) * fraction;
            setVehiclePosition([newLng, newLat]);

            // Calculate heading
            const dx = end[0] - start[0];
            const dy = end[1] - start[1];
            const heading = (Math.atan2(dy, dx) * 180 / Math.PI + 90) % 360;

            setTelemetry({
                id: 'route-simulation',
                vehicleId: selectedVehicle?.id || '',
                latitude: newLat,
                longitude: newLng,
                speed: Math.floor(25 + Math.random() * 35),
                heading: Math.floor(heading < 0 ? heading + 360 : heading),
                batteryLevel: selectedVehicle?.isElectric ? Math.floor(60 + Math.random() * 30) : undefined,
                fuelLevel: !selectedVehicle?.isElectric ? Math.floor(60 + Math.random() * 30) : undefined,
                timestamp: new Date().toISOString(),
            } as any);
        }
    }, [progress, routeCoordinates, selectedVehicle]);

    // Set static position for non-moving vehicles
    useEffect(() => {
        if (!selectedVehicle) return;
        if (selectedVehicle.status !== 'in_use') {
            const staticLat = 21.0285 + (Math.random() - 0.5) * 0.02;
            const staticLng = 105.8542 + (Math.random() - 0.5) * 0.02;
            setVehiclePosition([staticLng, staticLat]);
            setTelemetry({
                id: 'static',
                vehicleId: selectedVehicle.id,
                latitude: staticLat,
                longitude: staticLng,
                speed: 0,
                heading: 0,
                batteryLevel: selectedVehicle.isElectric ? 85 : undefined,
                fuelLevel: !selectedVehicle.isElectric ? 75 : undefined,
                timestamp: new Date().toISOString(),
            } as any);
        }
    }, [selectedVehicle]);

    const activeVehicles = vehicles.filter(v => v.status === 'in_use');
    const availableVehicles = vehicles.filter(v => v.status === 'available');

    // Build route config for in_use vehicles
    const routeConfig = selectedVehicle?.status === 'in_use' && routeDestination ? {
        start: [105.8342, 21.0185] as [number, number], // Starting point
        end: [routeDestination.longitude, routeDestination.latitude] as [number, number],
    } : undefined;

    // Build map markers
    const mapMarkers = [];
    if (selectedVehicle && vehiclePosition) {
        mapMarkers.push({
            id: selectedVehicle.id,
            coordinates: vehiclePosition,
            type: 'vehicle' as const,
            label: selectedVehicle.plate,
            popup: `${selectedVehicle.brand} ${selectedVehicle.model}<br/>Tốc độ: ${telemetry?.speed || 0} km/h`,
        });
    }
    if (routeDestination && selectedVehicle?.status === 'in_use') {
        mapMarkers.push({
            id: 'destination',
            coordinates: [routeDestination.longitude, routeDestination.latitude] as [number, number],
            type: 'facility' as const,
            label: routeDestination.name,
            popup: routeDestination.address || routeDestination.kind,
        });
    }

    const mapCenter: [number, number] = vehiclePosition || [105.8542, 21.0285];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Tracking xe</h1>
                    <p className="text-gray-500 mt-1">Theo dõi vị trí xe thời gian thực</p>
                </div>
                <div className="flex items-center gap-2">
                    {selectedVehicle?.status === 'in_use' && (
                        <Button
                            variant="outline"
                            onClick={() => setIsPlaying(!isPlaying)}
                        >
                            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                            <span className="ml-1">{isPlaying ? 'Dừng' : 'Chạy'}</span>
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        onClick={() => {
                            setProgress(0);
                            setRouteCoordinates([]);
                        }}
                        disabled={!selectedVehicle || trackingLoading}
                    >
                        <RefreshCw size={18} className={trackingLoading ? 'animate-spin' : ''} />
                        <span className="ml-1">Làm mới</span>
                    </Button>
                </div>
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
                                        {vehicle.status === 'in_use' && (
                                            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                                Đang di chuyển theo tuyến
                                            </p>
                                        )}
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
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                                    Vị trí xe {selectedVehicle ? `- ${selectedVehicle.plate}` : ''}
                                </h2>
                                {routeCoordinates.length > 0 && isPlaying && (
                                    <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                        Live
                                    </span>
                                )}
                            </div>
                            {routeDestination && selectedVehicle?.status === 'in_use' && (
                                <span className="text-sm text-gray-500">
                                    → {routeDestination.name}
                                </span>
                            )}
                        </CardHeader>
                        <CardBody>
                            <div className="h-96">
                                {!selectedVehicle ? (
                                    <div className="h-full bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                        <div className="text-center text-gray-500">
                                            <MapPin size={48} className="mx-auto mb-2 opacity-50" />
                                            <p>Chọn xe để xem vị trí</p>
                                        </div>
                                    </div>
                                ) : (
                                    <Map
                                        center={mapCenter}
                                        zoom={14}
                                        markers={mapMarkers}
                                        route={routeConfig}
                                        onRouteLoaded={handleRouteLoaded}
                                    />
                                )}
                            </div>
                            {/* Progress bar */}
                            {selectedVehicle?.status === 'in_use' && routeCoordinates.length > 0 && (
                                <div className="mt-3">
                                    <div className="flex justify-between text-sm text-gray-500 mb-1">
                                        <span>Xuất phát</span>
                                        <span>{Math.floor(progress * 100)}%</span>
                                        <span>{routeDestination?.name || 'Đích'}</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-blue-600 h-2 rounded-full transition-all duration-100"
                                            style={{ width: `${progress * 100}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </CardBody>
                    </Card>

                    {/* Telemetry Details */}
                    {selectedVehicle && (
                        <Card>
                            <CardHeader>
                                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Thông tin chi tiết</h2>
                            </CardHeader>
                            <CardBody>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center">
                                        <Navigation size={24} className="mx-auto mb-2 text-blue-500" />
                                        <p className="text-2xl font-bold text-gray-800 dark:text-white">
                                            {telemetry?.speed !== undefined ? telemetry.speed : '--'}
                                        </p>
                                        <p className="text-sm text-gray-500">km/h</p>
                                    </div>
                                    <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center">
                                        <MapPin size={24} className="mx-auto mb-2 text-green-500" />
                                        <p className="text-2xl font-bold text-gray-800 dark:text-white">
                                            {telemetry?.heading !== undefined ? `${telemetry.heading}°` : '--'}
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
                                                ? telemetry?.batteryLevel !== undefined ? `${telemetry.batteryLevel}%` : '--'
                                                : telemetry?.fuelLevel !== undefined ? `${telemetry.fuelLevel}%` : '--'}
                                        </p>
                                        <p className="text-sm text-gray-500">{selectedVehicle.isElectric ? 'Pin' : 'Xăng'}</p>
                                    </div>
                                    <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center">
                                        <RefreshCw size={24} className="mx-auto mb-2 text-purple-500" />
                                        <p className="text-sm font-bold text-gray-800 dark:text-white">
                                            {telemetry?.timestamp ? new Date(telemetry.timestamp).toLocaleTimeString('vi-VN') : '--:--'}
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
