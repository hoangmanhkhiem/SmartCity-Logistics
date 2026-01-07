'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardBody, CardHeader, Input, Badge, Button } from '@/components/ui';
import { orderApi, telemetryApi } from '@/lib/api';
import { Order, Telemetry } from '@/types';
import { MapPin, Package, Truck, Clock, Search, RefreshCw } from 'lucide-react';

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
    delivered: 'success',
    cancelled: 'error',
};

const statusLabel: Record<string, string> = {
    pending: 'Chờ xử lý',
    confirmed: 'Đã xác nhận',
    shipped: 'Đang giao',
    delivered: 'Đã giao',
    cancelled: 'Đã hủy',
};

export default function ConsumerTrackingPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [orders, setOrders] = useState<Order[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [telemetry, setTelemetry] = useState<Telemetry | null>(null);
    const [loading, setLoading] = useState(false);
    const [trackingLoading, setTrackingLoading] = useState(false);

    useEffect(() => {
        const fetchOrders = async () => {
            setLoading(true);
            try {
                const response = await orderApi.getAll({ status: 'shipped', limit: 20 });
                setOrders(response.data.data || response.data);
            } catch (error) {
                console.error('Failed to fetch orders:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, []);

    const handleTrackOrder = async (order: Order) => {
        setSelectedOrder(order);
        setTrackingLoading(true);
        try {
            // Try to get latest telemetry data
            const response = await telemetryApi.getAll({ limit: 1 });
            const latestTelemetry = response.data.data?.[0] || response.data[0];
            if (latestTelemetry) {
                setTelemetry(latestTelemetry);
            } else {
                // Use simulated data if no real telemetry
                setTelemetry({
                    id: 'simulated',
                    vehicleId: 'demo',
                    latitude: (order.deliveryLat || 21.0285) - 0.01,
                    longitude: (order.deliveryLon || 105.8542) - 0.01,
                    speed: Math.floor(Math.random() * 40) + 20,
                    heading: Math.floor(Math.random() * 360),
                    timestamp: new Date().toISOString(),
                } as any);
            }
        } catch (error) {
            console.error('Failed to fetch tracking:', error);
            // Use simulated data on error
            setTelemetry({
                id: 'simulated',
                vehicleId: 'demo',
                latitude: (order.deliveryLat || 21.0285) - 0.01,
                longitude: (order.deliveryLon || 105.8542) - 0.01,
                speed: Math.floor(Math.random() * 40) + 20,
                heading: Math.floor(Math.random() * 360),
                timestamp: new Date().toISOString(),
            } as any);
        } finally {
            setTrackingLoading(false);
        }
    };

    const filteredOrders = orders.filter(
        (order) =>
            order.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.deliveryAddress?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Build map markers
    const mapMarkers = [];
    if (selectedOrder && telemetry) {
        // Vehicle marker
        mapMarkers.push({
            id: 'vehicle',
            coordinates: [telemetry.longitude, telemetry.latitude] as [number, number],
            type: 'vehicle' as const,
            label: 'Xe giao hàng',
            popup: `Tốc độ: ${telemetry.speed || 0} km/h`,
        });
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

    const mapCenter: [number, number] = telemetry
        ? [telemetry.longitude, telemetry.latitude]
        : [105.8542, 21.0285];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Theo dõi đơn hàng</h1>
                <p className="text-gray-500 mt-1">Xem vị trí và trạng thái giao hàng theo thời gian thực</p>
            </div>

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
                                    <p>Không có đơn hàng đang giao</p>
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
                                            <Badge variant={statusVariant[order.status]}>
                                                {statusLabel[order.status]}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1 truncate">
                                            {order.deliveryAddress || 'Chưa có địa chỉ'}
                                        </p>
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
                            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Vị trí giao hàng</h2>
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
                        </CardHeader>
                        <CardBody>
                            <div className="h-80">
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
                                        zoom={13}
                                        markers={mapMarkers}
                                    />
                                )}
                            </div>
                        </CardBody>
                    </Card>

                    {/* Tracking Details */}
                    {selectedOrder && (
                        <Card>
                            <CardHeader>
                                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                                    Chi tiết theo dõi
                                </h2>
                            </CardHeader>
                            <CardBody>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                        <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                                            <Package size={20} className="text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Mã đơn hàng</p>
                                            <p className="font-semibold text-gray-800 dark:text-white">
                                                {selectedOrder.orderNumber}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                        <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                                            <Truck size={20} className="text-green-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Tốc độ hiện tại</p>
                                            <p className="font-semibold text-gray-800 dark:text-white">
                                                {telemetry?.speed ? `${telemetry.speed} km/h` : '-- km/h'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                        <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                                            <MapPin size={20} className="text-purple-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Địa chỉ giao</p>
                                            <p className="font-semibold text-gray-800 dark:text-white truncate">
                                                {selectedOrder.deliveryAddress || 'Chưa có'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                        <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg">
                                            <Clock size={20} className="text-orange-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Cập nhật lần cuối</p>
                                            <p className="font-semibold text-gray-800 dark:text-white">
                                                {telemetry?.timestamp
                                                    ? new Date(telemetry.timestamp).toLocaleTimeString('vi-VN')
                                                    : '--:--'}
                                            </p>
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
