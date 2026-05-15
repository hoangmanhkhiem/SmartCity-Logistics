'use client';

import { useState } from 'react';
import { Card, CardBody, CardHeader, DataTable, Badge, Button, Input } from '@/components/ui';
import { Package, Search, Plus } from 'lucide-react';
import type { Column } from '@/components/ui';

interface Order {
    id: string;
    customerName: string;
    pickup: string;
    delivery: string;
    status: 'pending' | 'in_transit' | 'delivered' | 'cancelled';
    createdAt: string;
    amount: number;
}

export default function OrdersPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [orders] = useState<Order[]>([
        {
            id: 'ORD001',
            customerName: 'Nguyễn Văn A',
            pickup: 'Quận 1, TP.HCM',
            delivery: 'Quận 7, TP.HCM',
            status: 'in_transit',
            createdAt: '2024-03-10',
            amount: 50000,
        },
        {
            id: 'ORD002',
            customerName: 'Trần Thị B',
            pickup: 'Gò Vấp, TP.HCM',
            delivery: 'Bình Thạnh, TP.HCM',
            status: 'delivered',
            createdAt: '2024-03-09',
            amount: 35000,
        },
    ]);

    const columns: Column<Order>[] = [
        { key: 'id', header: 'Mã đơn' },
        { key: 'customerName', header: 'Khách hàng' },
        { key: 'pickup', header: 'Điểm lấy' },
        { key: 'delivery', header: 'Điểm giao' },
        {
            key: 'status',
            header: 'Trạng thái',
            render: (o) => {
                const variants = {
                    pending: 'warning',
                    in_transit: 'default',
                    delivered: 'success',
                    cancelled: 'error',
                } as const;
                const labels = {
                    pending: 'Chờ xử lý',
                    in_transit: 'Đang giao',
                    delivered: 'Đã giao',
                    cancelled: 'Đã hủy',
                };
                return (
                    <Badge variant={variants[o.status]}>
                        {labels[o.status]}
                    </Badge>
                );
            },
        },
        {
            key: 'amount',
            header: 'Giá trị',
            render: (o) => `${o.amount.toLocaleString('vi-VN')}đ`,
        },
    ];

    const filteredOrders = orders.filter((o) =>
        o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.customerName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Quản lý Đơn hàng</h1>
                    <p className="text-gray-500 mt-1">Danh sách đơn hàng</p>
                </div>
                <Button>
                    <Plus size={16} className="mr-2" />
                    Tạo đơn hàng
                </Button>
            </div>

            <div className="grid grid-cols-4 gap-4">
                <Card>
                    <CardBody className="flex items-center gap-3">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-xl">
                            <Package size={24} className="text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{orders.length}</p>
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
                            <p className="text-2xl font-bold">{orders.filter(o => o.status === 'pending').length}</p>
                            <p className="text-sm text-gray-500">Chờ xử lý</p>
                        </div>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="flex items-center gap-3">
                        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl">
                            <Package size={24} className="text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{orders.filter(o => o.status === 'in_transit').length}</p>
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
                            <p className="text-2xl font-bold">{orders.filter(o => o.status === 'delivered').length}</p>
                            <p className="text-sm text-gray-500">Đã giao</p>
                        </div>
                    </CardBody>
                </Card>
            </div>

            <Card>
                <CardBody>
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <Input
                            placeholder="Tìm mã đơn, khách hàng..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardBody>
            </Card>

            <Card>
                <CardHeader>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Danh sách đơn hàng</h2>
                </CardHeader>
                <CardBody>
                    <DataTable
                        columns={columns}
                        data={filteredOrders}
                        loading={false}
                        emptyMessage="Chưa có đơn hàng"
                    />
                </CardBody>
            </Card>
        </div>
    );
}
