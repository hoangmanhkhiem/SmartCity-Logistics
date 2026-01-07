'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardBody, CardHeader, DataTable, Badge, Select, Button, Input, Modal } from '@/components/ui';
import { orderApi } from '@/lib/api';
import { Order } from '@/types';
import { Package, Search, Eye, MapPin, Navigation, Truck } from 'lucide-react';
import type { Column } from '@/components/ui';

// Dynamic import for Map to avoid SSR issues
const MapView = dynamic(() => import('@/components/shared/map'), {
    ssr: false,
    loading: () => (
        <div className="h-64 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
            <div className="flex items-center gap-2 text-gray-500">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                Đang tải bản đồ...
            </div>
        </div>
    )
});

const statusOptions = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: 'pending', label: 'Chờ xử lý' },
    { value: 'confirmed', label: 'Đã xác nhận' },
    { value: 'shipped', label: 'Đang giao' },
    { value: 'delivered', label: 'Đã giao' },
    { value: 'cancelled', label: 'Đã hủy' },
];

const statusVariant: Record<string, 'default' | 'warning' | 'info' | 'success' | 'error'> = {
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

export default function ConsumerOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [statusFilter, setStatusFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [showTrackingModal, setShowTrackingModal] = useState(false);

    // Route animation state
    const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
    const [progress, setProgress] = useState(0);
    const [vehiclePosition, setVehiclePosition] = useState<[number, number] | null>(null);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const params: Record<string, unknown> = { page, limit: 10 };
            if (statusFilter) params.status = statusFilter;
            const response = await orderApi.getAll(params);
            setOrders(response.data.data || response.data);
            setTotalPages(response.data.meta?.totalPages || 1);
        } catch (error) {
            console.error('Failed to fetch orders:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [page, statusFilter]);

    // Handle route loaded from Map component
    const handleRouteLoaded = useCallback((coordinates: [number, number][]) => {
        setRouteCoordinates(coordinates);
        if (coordinates.length > 0) {
            setVehiclePosition(coordinates[0]);
        }
        setProgress(0);
    }, []);

    // Animate vehicle along route
    useEffect(() => {
        if (!showTrackingModal || routeCoordinates.length === 0) return;

        const interval = setInterval(() => {
            setProgress(prev => {
                const newProgress = prev + 0.005;
                if (newProgress >= 1) {
                    return 0;
                }
                return newProgress;
            });
        }, 100);

        return () => clearInterval(interval);
    }, [showTrackingModal, routeCoordinates.length]);

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
        }
    }, [progress, routeCoordinates]);

    const handleViewTracking = (order: Order) => {
        setSelectedOrder(order);
        setShowTrackingModal(true);
        setProgress(0);
        setRouteCoordinates([]);
    };

    const columns: Column<Order>[] = [
        { key: 'orderNumber', header: 'Mã đơn' },
        {
            key: 'status',
            header: 'Trạng thái',
            render: (order) => (
                <Badge variant={statusVariant[order.status] || 'default'}>
                    {statusLabel[order.status] || order.status}
                </Badge>
            ),
        },
        { key: 'deliveryAddress', header: 'Địa chỉ giao' },
        {
            key: 'createdAt',
            header: 'Ngày tạo',
            render: (order) => new Date(order.createdAt).toLocaleDateString('vi-VN'),
        },
        {
            key: 'actions',
            header: '',
            render: (order) => (
                <div className="flex items-center gap-1">
                    {['shipped', 'confirmed'].includes(order.status) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleViewTracking(order);
                            }}
                            className="text-green-600"
                        >
                            <Navigation size={16} />
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOrder(order);
                            setShowTrackingModal(false);
                        }}
                    >
                        <Eye size={16} />
                    </Button>
                </div>
            ),
        },
    ];

    const filteredOrders = orders.filter((order) =>
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
    if (selectedOrder && showTrackingModal) {
        // Vehicle marker
        if (vehiclePosition) {
            mapMarkers.push({
                id: 'vehicle',
                coordinates: vehiclePosition,
                type: 'vehicle' as const,
                label: 'Xe giao hàng',
                popup: `Tiến độ: ${Math.floor(progress * 100)}%`,
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
                popup: selectedOrder.deliveryAddress || 'Điểm giao',
            });
        }
    }

    const mapCenter: [number, number] = vehiclePosition || [105.8542, 21.0285];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Đơn hàng của tôi</h1>
                    <p className="text-gray-500 mt-1">Theo dõi và quản lý đơn hàng</p>
                </div>
                <div className="flex items-center gap-2">
                    <Package className="text-blue-500" size={24} />
                    <span className="text-2xl font-bold text-gray-800 dark:text-white">{orders.length}</span>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardBody className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <Input
                                placeholder="Tìm kiếm đơn hàng..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>
                    <div className="w-48">
                        <Select
                            options={statusOptions}
                            value={statusFilter}
                            onChange={setStatusFilter}
                            placeholder="Trạng thái"
                        />
                    </div>
                </CardBody>
            </Card>

            {/* Orders Table */}
            <Card>
                <CardHeader>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Danh sách đơn hàng</h2>
                </CardHeader>
                <CardBody>
                    <DataTable
                        columns={columns}
                        data={filteredOrders}
                        loading={loading}
                        emptyMessage="Bạn chưa có đơn hàng nào"
                        pagination={{
                            page,
                            totalPages,
                            onPageChange: setPage,
                        }}
                        onRowClick={(order) => {
                            setSelectedOrder(order);
                            setShowTrackingModal(false);
                        }}
                    />
                </CardBody>
            </Card>

            {/* Tracking Map Modal */}
            <Modal
                isOpen={showTrackingModal && !!selectedOrder}
                onClose={() => setShowTrackingModal(false)}
                title={`Lộ trình vận chuyển - ${selectedOrder?.orderNumber || ''}`}
                size="xl"
            >
                {selectedOrder && (
                    <div className="space-y-4">
                        {/* Live indicator */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                                <span className="text-sm font-medium text-green-600">Đang cập nhật trực tiếp</span>
                            </div>
                            <Badge variant={statusVariant[selectedOrder.status] || 'default'}>
                                {statusLabel[selectedOrder.status] || selectedOrder.status}
                            </Badge>
                        </div>

                        {/* Map */}
                        <div className="h-80 rounded-lg overflow-hidden">
                            <MapView
                                center={mapCenter}
                                zoom={13}
                                markers={mapMarkers}
                                route={routeConfig}
                                onRouteLoaded={handleRouteLoaded}
                            />
                        </div>

                        {/* Progress bar */}
                        {routeCoordinates.length > 0 && (
                            <div>
                                <div className="flex justify-between text-sm text-gray-500 mb-1">
                                    <span>Điểm lấy hàng</span>
                                    <span className="font-medium text-blue-600">{Math.floor(progress * 100)}%</span>
                                    <span>Điểm giao hàng</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-blue-600 h-2 rounded-full transition-all duration-100"
                                        style={{ width: `${progress * 100}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Order info */}
                        <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                            <div className="flex items-center gap-2">
                                <MapPin size={16} className="text-green-500" />
                                <div>
                                    <p className="text-xs text-gray-500">Điểm lấy hàng</p>
                                    <p className="text-sm font-medium truncate">{selectedOrder.pickupAddress || 'Kho hàng'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin size={16} className="text-red-500" />
                                <div>
                                    <p className="text-xs text-gray-500">Điểm giao</p>
                                    <p className="text-sm font-medium truncate">{selectedOrder.deliveryAddress || 'Chưa có'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-3 flex justify-end">
                            <Button onClick={() => setShowTrackingModal(false)}>Đóng</Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Order Detail Modal */}
            <Modal
                isOpen={!!selectedOrder && !showTrackingModal}
                onClose={() => setSelectedOrder(null)}
                title={`Chi tiết đơn hàng ${selectedOrder?.orderNumber || ''}`}
                size="lg"
            >
                {selectedOrder && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-500">Trạng thái</p>
                                <Badge variant={statusVariant[selectedOrder.status] || 'default'}>
                                    {statusLabel[selectedOrder.status] || selectedOrder.status}
                                </Badge>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Độ ưu tiên</p>
                                <p className="font-medium">{selectedOrder.priority || 1}</p>
                            </div>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Địa chỉ lấy hàng</p>
                            <p className="font-medium">{selectedOrder.pickupAddress || 'Chưa có'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Địa chỉ giao hàng</p>
                            <p className="font-medium">{selectedOrder.deliveryAddress || 'Chưa có'}</p>
                        </div>
                        {selectedOrder.timeWindowStart && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">Thời gian bắt đầu</p>
                                    <p className="font-medium">
                                        {new Date(selectedOrder.timeWindowStart).toLocaleString('vi-VN')}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Thời gian kết thúc</p>
                                    <p className="font-medium">
                                        {selectedOrder.timeWindowEnd
                                            ? new Date(selectedOrder.timeWindowEnd).toLocaleString('vi-VN')
                                            : 'Không giới hạn'}
                                    </p>
                                </div>
                            </div>
                        )}
                        {selectedOrder.notes && (
                            <div>
                                <p className="text-sm text-gray-500">Ghi chú</p>
                                <p className="font-medium">{selectedOrder.notes}</p>
                            </div>
                        )}
                        <div className="pt-4 border-t flex justify-between">
                            {['shipped', 'confirmed'].includes(selectedOrder.status) && (
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowTrackingModal(true);
                                    }}
                                >
                                    <Truck size={16} className="mr-1" />
                                    Xem lộ trình
                                </Button>
                            )}
                            <Button onClick={() => setSelectedOrder(null)}>Đóng</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
