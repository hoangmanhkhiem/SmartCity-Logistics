'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardBody, CardHeader, Input, Badge, Button } from '@/components/ui';
import { orderApi } from '@/lib/api';
import { ShipmentTrackingLookup } from '@/components/logistics/shipment-tracking-lookup';
import { Order, Telemetry } from '@/types';
import { MapPin, Package, Truck, Clock, Search, RefreshCw, Play, Pause } from 'lucide-react';
import { viStatus } from '@/lib/status-labels';

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

const statusVariant: Record<string, 'warning' | 'info' | 'success' | 'error'> = {
    pending: 'warning',
    confirmed: 'info',
    shipped: 'info',
    in_transit: 'info',
    delivered: 'success',
    cancelled: 'error',
};

export default function ConsumerTrackingPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [orders, setOrders] = useState<Order[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [telemetry, setTelemetry] = useState<Telemetry | null>(null);
    const [loading, setLoading] = useState(false);
    const [trackingLoading, setTrackingLoading] = useState(false);

    // Route animation state
    const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
    const [progress, setProgress] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const [vehiclePosition, setVehiclePosition] = useState<[number, number] | null>(null);

    useEffect(() => {
        const fetchOrders = async () => {
            setLoading(true);
            try {
                const response = await orderApi.getAll({ limit: 50 });
                const allOrders = response.data.data || response.data;
                setOrders(allOrders);
            } catch (error) {
                console.error('Failed to fetch orders:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, []);

    // Handle route loaded from Map component
    const handleRouteLoaded = useCallback((coordinates: [number, number][]) => {
        setRouteCoordinates(coordinates);
        setProgress(0);
        if (coordinates.length > 0) {
            setVehiclePosition(coordinates[0]);
        }
    }, []);

    // Animate vehicle along route
    useEffect(() => {
        if (!isPlaying || routeCoordinates.length === 0 || !selectedOrder) return;
        if (!['shipped', 'confirmed'].includes(selectedOrder.status)) return;

        const interval = setInterval(() => {
            setProgress(prev => {
                const newProgress = prev + 0.0015; // 0.15% per tick
                if (newProgress >= 1) {
                    return 0; // Loop back
                }
                return newProgress;
            });
        }, 100); // Update every 100ms for smooth animation

        return () => clearInterval(interval);
    }, [isPlaying, routeCoordinates.length, selectedOrder]);

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

            // Update telemetry
            setTelemetry({
                id: 'route-simulation',
                vehicleId: 'demo',
                latitude: newLat,
                longitude: newLng,
                speed: Math.floor(30 + Math.random() * 20),
                heading: Math.floor(heading < 0 ? heading + 360 : heading),
                timestamp: new Date().toISOString(),
            } as any);
        }
    }, [progress, routeCoordinates]);

    const handleTrackOrder = async (order: Order) => {
        setSelectedOrder(order);
        setTrackingLoading(true);
        setProgress(0);
        setRouteCoordinates([]);
        setIsPlaying(true);

        setTimeout(() => setTrackingLoading(false), 500);
    };

    const filteredOrders = orders.filter(
        (order) =>
            order.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.deliveryAddress?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Build route config for Map
    const routeConfig = selectedOrder && ['shipped', 'confirmed'].includes(selectedOrder.status) ? {
        start: [
            selectedOrder.pickupLon || 105.8342,
            selectedOrder.pickupLat || 21.0185
        ] as [number, number],
        end: [
            selectedOrder.deliveryLon || 105.8542,
            selectedOrder.deliveryLat || 21.0285
        ] as [number, number],
    } : undefined;

    // Build map markers
    const mapMarkers = [];
    if (selectedOrder) {
        // Vehicle marker (animated position)
        if (vehiclePosition) {
            mapMarkers.push({
                id: 'vehicle',
                coordinates: vehiclePosition,
                type: 'vehicle' as const,
                label: 'Xe giao hàng',
                popup: `Tốc độ: ${telemetry?.speed || 0} km/h<br/>Tiến độ: ${Math.floor(progress * 100)}%`,
            });
        }
        // Pickup marker
        if (selectedOrder.pickupLat && selectedOrder.pickupLon) {
            mapMarkers.push({
                id: 'pickup',
                coordinates: [selectedOrder.pickupLon, selectedOrder.pickupLat] as [number, number],
                type: 'facility' as const,
                label: 'Điểm lấy hàng',
                popup: selectedOrder.pickupAddress || 'Điểm lấy hàng',
            });
        }
        // Destination marker
        if (selectedOrder.deliveryLat && selectedOrder.deliveryLon) {
            mapMarkers.push({
                id: 'destination',
                coordinates: [selectedOrder.deliveryLon, selectedOrder.deliveryLat] as [number, number],
                type: 'destination' as const,
                label: 'Điểm giao',
                popup: selectedOrder.deliveryAddress || 'Địa chỉ giao hàng',
            });
        }
    }

    const mapCenter: [number, number] = vehiclePosition || [105.8542, 21.0285];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Theo dõi đơn hàng</h1>
                <p className="text-gray-500 mt-1">
                    Tra cứu theo mã vận đơn / SĐT bên dưới; hoặc chọn đơn trong danh sách của bạn để xem mô phỏng trên bản đồ.
                </p>
            </div>

            <ShipmentTrackingLookup />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Orders List */}
                <div className="lg:col-span-1 space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="relative w-full">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <Input
                                    placeholder="Tìm mã đơn hàng..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </CardHeader>
                        <CardBody className="space-y-2 max-h-[400px] overflow-y-auto">
                            {loading ? (
                                <div className="flex items-center justify-center py-8 text-gray-500">
                                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2" />
                                    Đang tải...
                                </div>
                            ) : filteredOrders.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <Package size={32} className="mx-auto mb-2 opacity-50" />
                                    <p>Không có đơn hàng</p>
                                </div>
                            ) : (
                                filteredOrders.map((order) => (
                                    <div
                                        key={order.id}
                                        onClick={() => handleTrackOrder(order)}
                                        className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedOrder?.id === order.id
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium text-gray-800 dark:text-white">
                                                {order.orderNumber}
                                            </span>
                                            <Badge variant={statusVariant[order.status] || 'default'}>
                                                {viStatus(order.status)}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1 truncate">
                                            {order.deliveryAddress || 'Chưa có địa chỉ'}
                                        </p>
                                        {['shipped', 'confirmed'].includes(order.status) && (
                                            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                                Có thể theo dõi trực tiếp
                                            </p>
                                        )}
                                    </div>
                                ))
                            )}
                        </CardBody>
                    </Card>
                </div>

                {/* Map & Tracking Info */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Map */}
                    <Card>
                        <CardHeader className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Vị trí giao hàng</h2>
                                {routeCoordinates.length > 0 && (
                                    <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                        Live
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {selectedOrder && ['shipped', 'confirmed'].includes(selectedOrder.status) && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setIsPlaying(!isPlaying)}
                                    >
                                        {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                                    </Button>
                                )}
                                {selectedOrder && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleTrackOrder(selectedOrder)}
                                        disabled={trackingLoading}
                                    >
                                        <RefreshCw size={16} className={trackingLoading ? 'animate-spin' : ''} />
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardBody>
                            <div className="h-96">
                                {!selectedOrder ? (
                                    <div className="h-full bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                        <div className="text-center text-gray-500">
                                            <MapPin size={48} className="mx-auto mb-2 opacity-50" />
                                            <p>Chọn đơn hàng để xem vị trí</p>
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
                                        route={routeConfig}
                                        onRouteLoaded={handleRouteLoaded}
                                    />
                                )}
                            </div>
                            {/* Progress bar */}
                            {selectedOrder && ['shipped', 'confirmed'].includes(selectedOrder.status) && routeCoordinates.length > 0 && (
                                <div className="mt-3">
                                    <div className="flex justify-between text-sm text-gray-500 mb-1">
                                        <span>Điểm lấy hàng</span>
                                        <span>{Math.floor(progress * 100)}%</span>
                                        <span>Điểm giao</span>
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

                    {/* Tracking Details */}
                    {selectedOrder && (
                        <Card>
                            <CardHeader>
                                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Chi tiết theo dõi</h2>
                            </CardHeader>
                            <CardBody>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                        <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                                            <Package size={20} className="text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Mã đơn hàng</p>
                                            <p className="font-semibold text-gray-800 dark:text-white">{selectedOrder.orderNumber}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                        <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                                            <Truck size={20} className="text-green-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Tốc độ hiện tại</p>
                                            <p className="font-semibold text-gray-800 dark:text-white">{telemetry?.speed || '--'} km/h</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                        <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                                            <MapPin size={20} className="text-purple-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Địa chỉ giao</p>
                                            <p className="font-semibold text-gray-800 dark:text-white truncate max-w-[200px]">{selectedOrder.deliveryAddress || 'Chưa có'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                        <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg">
                                            <Clock size={20} className="text-orange-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Cập nhật lần cuối</p>
                                            <p className="font-semibold text-gray-800 dark:text-white">{telemetry?.timestamp ? new Date(telemetry.timestamp).toLocaleTimeString('vi-VN') : '--:--'}</p>
                                        </div>
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
