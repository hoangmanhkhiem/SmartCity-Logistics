'use client';

import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, DataTable, Badge, Select, Button, Input, Modal } from '@/components/ui';
import { orderApi } from '@/lib/api';
import { Order } from '@/types';
import { Package, Plus, Search, Eye, Edit, MapPin } from 'lucide-react';
import type { Column } from '@/components/ui';

const statusOptions = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: 'pending', label: 'Chờ xử lý' },
    { value: 'confirmed', label: 'Đã xác nhận' },
    { value: 'shipped', label: 'Đang giao' },
    { value: 'delivered', label: 'Đã giao' },
    { value: 'cancelled', label: 'Đã hủy' },
];

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

export default function DeliveryOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [statusFilter, setStatusFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [formData, setFormData] = useState({
        pickupAddress: '',
        deliveryAddress: '',
        priority: '1',
        notes: '',
    });

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

    const handleUpdateStatus = async (orderId: string, newStatus: string) => {
        try {
            await orderApi.update(orderId, { status: newStatus });
            fetchOrders();
            setSelectedOrder(null);
        } catch (error) {
            console.error('Failed to update order:', error);
        }
    };

    const handleCreateOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await orderApi.create({
                pickupAddress: formData.pickupAddress,
                deliveryAddress: formData.deliveryAddress,
                priority: Number(formData.priority),
                notes: formData.notes || undefined,
            });
            setIsCreateOpen(false);
            setFormData({ pickupAddress: '', deliveryAddress: '', priority: '1', notes: '' });
            fetchOrders();
        } catch (error) {
            console.error('Failed to create order:', error);
        }
    };

    const columns: Column<Order>[] = [
        {
            key: 'orderNumber',
            header: 'Mã đơn',
            render: (o) => <span className="font-mono font-semibold">{o.orderNumber}</span>
        },
        {
            key: 'status',
            header: 'Trạng thái',
            render: (o) => (
                <Badge variant={statusVariant[o.status] || 'default'}>
                    {statusLabel[o.status] || o.status}
                </Badge>
            ),
        },
        {
            key: 'pickupAddress',
            header: 'Điểm lấy',
            render: (o) => (
                <span className="truncate max-w-[150px] block" title={o.pickupAddress}>
                    {o.pickupAddress || '-'}
                </span>
            ),
        },
        {
            key: 'deliveryAddress',
            header: 'Điểm giao',
            render: (o) => (
                <span className="truncate max-w-[150px] block" title={o.deliveryAddress}>
                    {o.deliveryAddress || '-'}
                </span>
            ),
        },
        {
            key: 'priority',
            header: 'Ưu tiên',
            render: (o) => (
                <Badge variant={o.priority >= 3 ? 'error' : o.priority >= 2 ? 'warning' : 'default'}>
                    {o.priority}
                </Badge>
            ),
        },
        {
            key: 'createdAt',
            header: 'Ngày tạo',
            render: (o) => new Date(o.createdAt).toLocaleDateString('vi-VN'),
        },
        {
            key: 'actions',
            header: '',
            render: (o) => (
                <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(o)}>
                    <Eye size={16} />
                </Button>
            ),
        },
    ];

    const filteredOrders = orders.filter((o) =>
        o.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.deliveryAddress?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.pickupAddress?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Stats
    const stats = {
        total: orders.length,
        pending: orders.filter(o => o.status === 'pending').length,
        shipped: orders.filter(o => o.status === 'shipped').length,
        delivered: orders.filter(o => o.status === 'delivered').length,
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Quản lý đơn hàng</h1>
                    <p className="text-gray-500 mt-1">Xử lý và theo dõi đơn hàng</p>
                </div>
                <Button onClick={() => setIsCreateOpen(true)}>
                    <Plus size={18} className="mr-1" />
                    Tạo đơn
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardBody className="flex items-center gap-3">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-xl">
                            <Package size={24} className="text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.total}</p>
                            <p className="text-sm text-gray-500">Tổng đơn</p>
                        </div>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="flex items-center gap-3">
                        <div className="p-3 bg-yellow-100 dark:bg-yellow-900/50 rounded-xl">
                            <Package size={24} className="text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.pending}</p>
                            <p className="text-sm text-gray-500">Chờ xử lý</p>
                        </div>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="flex items-center gap-3">
                        <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-xl">
                            <Package size={24} className="text-purple-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.shipped}</p>
                            <p className="text-sm text-gray-500">Đang giao</p>
                        </div>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="flex items-center gap-3">
                        <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-xl">
                            <Package size={24} className="text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.delivered}</p>
                            <p className="text-sm text-gray-500">Hoàn thành</p>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardBody className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <Input
                                placeholder="Tìm mã đơn, địa chỉ..."
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
                            onChange={(v) => { setStatusFilter(v); setPage(1); }}
                        />
                    </div>
                </CardBody>
            </Card>

            {/* Table */}
            <Card>
                <CardHeader>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Danh sách đơn hàng</h2>
                </CardHeader>
                <CardBody>
                    <DataTable
                        columns={columns}
                        data={filteredOrders}
                        loading={loading}
                        emptyMessage="Chưa có đơn hàng"
                        pagination={{ page, totalPages, onPageChange: setPage }}
                    />
                </CardBody>
            </Card>

            {/* Order Detail Modal */}
            <Modal
                isOpen={!!selectedOrder}
                onClose={() => setSelectedOrder(null)}
                title={`Chi tiết đơn ${selectedOrder?.orderNumber || ''}`}
                size="lg"
            >
                {selectedOrder && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Badge variant={statusVariant[selectedOrder.status] || 'default'} className="text-sm">
                                {statusLabel[selectedOrder.status] || selectedOrder.status}
                            </Badge>
                            <span className="text-sm text-gray-500">
                                Độ ưu tiên: {selectedOrder.priority}
                            </span>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <MapPin size={20} className="text-green-500 mt-0.5" />
                                <div>
                                    <p className="text-sm text-gray-500">Điểm lấy hàng</p>
                                    <p className="font-medium">{selectedOrder.pickupAddress || 'Chưa có'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <MapPin size={20} className="text-red-500 mt-0.5" />
                                <div>
                                    <p className="text-sm text-gray-500">Điểm giao hàng</p>
                                    <p className="font-medium">{selectedOrder.deliveryAddress || 'Chưa có'}</p>
                                </div>
                            </div>
                        </div>
                        {selectedOrder.notes && (
                            <div>
                                <p className="text-sm text-gray-500">Ghi chú</p>
                                <p className="font-medium">{selectedOrder.notes}</p>
                            </div>
                        )}

                        {/* Quick status update */}
                        <div className="pt-4 border-t">
                            <p className="text-sm text-gray-500 mb-2">Cập nhật trạng thái:</p>
                            <div className="flex flex-wrap gap-2">
                                {selectedOrder.status === 'pending' && (
                                    <Button size="sm" onClick={() => handleUpdateStatus(selectedOrder.id, 'confirmed')}>
                                        Xác nhận
                                    </Button>
                                )}
                                {selectedOrder.status === 'confirmed' && (
                                    <Button size="sm" onClick={() => handleUpdateStatus(selectedOrder.id, 'shipped')}>
                                        Bắt đầu giao
                                    </Button>
                                )}
                                {selectedOrder.status === 'shipped' && (
                                    <Button size="sm" onClick={() => handleUpdateStatus(selectedOrder.id, 'delivered')}>
                                        Hoàn thành
                                    </Button>
                                )}
                                {['pending', 'confirmed'].includes(selectedOrder.status) && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleUpdateStatus(selectedOrder.id, 'cancelled')}
                                    >
                                        Hủy đơn
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Create Order Modal */}
            <Modal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                title="Tạo đơn hàng mới"
                size="lg"
            >
                <form onSubmit={handleCreateOrder} className="space-y-4">
                    <Input
                        label="Địa chỉ lấy hàng *"
                        value={formData.pickupAddress}
                        onChange={(e) => setFormData({ ...formData, pickupAddress: e.target.value })}
                        required
                        placeholder="Số nhà, đường, phường..."
                    />
                    <Input
                        label="Địa chỉ giao hàng *"
                        value={formData.deliveryAddress}
                        onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                        required
                        placeholder="Số nhà, đường, phường..."
                    />
                    <Select
                        label="Độ ưu tiên"
                        options={[
                            { value: '1', label: '1 - Thường' },
                            { value: '2', label: '2 - Cao' },
                            { value: '3', label: '3 - Khẩn cấp' },
                        ]}
                        value={formData.priority}
                        onChange={(v) => setFormData({ ...formData, priority: v })}
                    />
                    <Input
                        label="Ghi chú"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Ghi chú thêm..."
                    />
                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                            Hủy
                        </Button>
                        <Button type="submit">
                            Tạo đơn
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
