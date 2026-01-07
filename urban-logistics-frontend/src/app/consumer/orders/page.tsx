'use client';

import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, DataTable, Badge, Select, Button, Input, Modal } from '@/components/ui';
import { orderApi } from '@/lib/api';
import { Order } from '@/types';
import { Package, Search, Eye } from 'lucide-react';
import type { Column } from '@/components/ui';

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
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOrder(order);
                    }}
                >
                    <Eye size={16} />
                </Button>
            ),
        },
    ];

    const filteredOrders = orders.filter((order) =>
        order.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.deliveryAddress?.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                        onRowClick={setSelectedOrder}
                    />
                </CardBody>
            </Card>

            {/* Order Detail Modal */}
            <Modal
                isOpen={!!selectedOrder}
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
                        <div className="pt-4 border-t flex justify-end">
                            <Button onClick={() => setSelectedOrder(null)}>Đóng</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
