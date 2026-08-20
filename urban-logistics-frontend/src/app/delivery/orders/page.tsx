'use client';

import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, DataTable, Badge, Select, Button, Input, Modal } from '@/components/ui';
import { orderApi } from '@/lib/api';
import { useCurrentCarrier } from '@/lib/use-current-carrier';
import { Order } from '@/types';
import { Package, Plus, Search, Eye, MapPin } from 'lucide-react';
import type { Column } from '@/components/ui';
import { viStatus, ORDER_STATUS_OPTIONS } from '@/lib/status-labels';
import { formatCurrency } from '@/lib/utils';

const statusOptions = [{ value: '', label: 'Tất cả trạng thái' }, ...ORDER_STATUS_OPTIONS];

const statusVariant: Record<string, 'warning' | 'info' | 'success' | 'error'> = {
    pending: 'warning',
    assigned: 'info',
    in_transit: 'info',
    delivered: 'success',
    failed: 'error',
    cancelled: 'error',
};

export default function DeliveryOrdersPage() {
    const { carrier } = useCurrentCarrier();
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
        pickupPhone: '',
        deliveryPhone: '',
        sourceUrl: '',
        priority: '1',
        codAmount: '',
        notes: '',
    });

    const fetchOrders = async () => {
        if (!carrier) return;
        setLoading(true);
        try {
            const params: Record<string, unknown> = { page, limit: 10, carrierId: carrier.id };
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [carrier, page, statusFilter]);

    const handleUpdateStatus = async (orderId: number, newStatus: string) => {
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
        if (!carrier) return;
        try {
            await orderApi.create({
                carrierId: carrier.id,
                pickupAddress: formData.pickupAddress,
                deliveryAddress: formData.deliveryAddress,
                pickupPhone: formData.pickupPhone || undefined,
                deliveryPhone: formData.deliveryPhone || undefined,
                sourceUrl: formData.sourceUrl || undefined,
                priority: Number(formData.priority),
                codAmount: formData.codAmount ? Number(formData.codAmount) : undefined,
                notes: formData.notes || undefined,
            });
            setIsCreateOpen(false);
            setFormData({
                pickupAddress: '',
                deliveryAddress: '',
                pickupPhone: '',
                deliveryPhone: '',
                sourceUrl: '',
                priority: '1',
                codAmount: '',
                notes: '',
            });
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
                    {viStatus(o.status)}
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
        inTransit: orders.filter(o => o.status === 'in_transit' || o.status === 'assigned').length,
        delivered: orders.filter(o => o.status === 'delivered').length,
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Quản lý đơn hàng</h1>
                    <p className="text-slate-500 mt-1">Xử lý và theo dõi đơn hàng</p>
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
                        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl">
                            <Package size={24} className="text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.total}</p>
                            <p className="text-sm text-slate-500">Tổng đơn</p>
                        </div>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="flex items-center gap-3">
                        <div className="p-3 bg-yellow-100 dark:bg-yellow-900/50 rounded-xl">
                            <Package size={24} className="text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.pending}</p>
                            <p className="text-sm text-slate-500">Chờ xử lý</p>
                        </div>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="flex items-center gap-3">
                        <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-xl">
                            <Package size={24} className="text-purple-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.inTransit}</p>
                            <p className="text-sm text-slate-500">Đang giao</p>
                        </div>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="flex items-center gap-3">
                        <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-xl">
                            <Package size={24} className="text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.delivered}</p>
                            <p className="text-sm text-slate-500">Hoàn thành</p>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardBody className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
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
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Danh sách đơn hàng</h2>
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
                                {viStatus(selectedOrder.status)}
                            </Badge>
                            <span className="text-sm text-slate-500">
                                Độ ưu tiên: {selectedOrder.priority}
                            </span>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                <MapPin size={20} className="text-green-500 mt-0.5" />
                                <div>
                                    <p className="text-sm text-slate-500">Điểm lấy hàng</p>
                                    <p className="font-medium">{selectedOrder.pickupAddress || 'Chưa có'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                <MapPin size={20} className="text-red-500 mt-0.5" />
                                <div>
                                    <p className="text-sm text-slate-500">Điểm giao hàng</p>
                                    <p className="font-medium">{selectedOrder.deliveryAddress || 'Chưa có'}</p>
                                </div>
                            </div>
                        </div>
                        {selectedOrder.codAmount != null && selectedOrder.codAmount > 0 && (
                            <div>
                                <p className="text-sm text-slate-500">Thu hộ (COD)</p>
                                <p className="font-medium">{formatCurrency(selectedOrder.codAmount)}</p>
                            </div>
                        )}
                        {selectedOrder.notes && (
                            <div>
                                <p className="text-sm text-slate-500">Ghi chú</p>
                                <p className="font-medium">{selectedOrder.notes}</p>
                            </div>
                        )}

                        {/* Trạng thái đơn được cập nhật tự động khi gom vào Route / Shipper xử lý stop */}
                        {selectedOrder.status === 'pending' && (
                            <div className="pt-4 border-t">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleUpdateStatus(selectedOrder.id, 'cancelled')}
                                >
                                    Hủy đơn
                                </Button>
                            </div>
                        )}
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input
                            label="SĐT lấy hàng"
                            value={formData.pickupPhone}
                            onChange={(e) => setFormData({ ...formData, pickupPhone: e.target.value })}
                            placeholder="09..."
                        />
                        <Input
                            label="SĐT nhận hàng"
                            value={formData.deliveryPhone}
                            onChange={(e) => setFormData({ ...formData, deliveryPhone: e.target.value })}
                            placeholder="09..."
                        />
                    </div>
                    <Input
                        label="Link nguồn (Shopee / web)"
                        value={formData.sourceUrl}
                        onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })}
                        placeholder="https://..."
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                            label="Thu hộ (COD, VNĐ)"
                            type="number"
                            value={formData.codAmount}
                            onChange={(e) => setFormData({ ...formData, codAmount: e.target.value })}
                            placeholder="0"
                        />
                    </div>
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
