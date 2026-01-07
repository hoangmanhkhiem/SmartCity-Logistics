'use client';

import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, DataTable, Badge, Button, Input, Modal } from '@/components/ui';
import { userApi } from '@/lib/api';
import { User } from '@/types';
import { Users, Search, Eye, Edit, Phone, Mail } from 'lucide-react';
import type { Column } from '@/components/ui';

export default function DeliveryDriversPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await userApi.getAll({ page, limit: 10 });
            setUsers(response.data.data || response.data);
            setTotalPages(response.data.meta?.totalPages || 1);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [page]);

    const columns: Column<User>[] = [
        {
            key: 'name',
            header: 'Họ tên',
            render: (u) => (
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        {u.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <span className="font-medium">{u.name}</span>
                </div>
            ),
        },
        { key: 'email', header: 'Email' },
        { key: 'phone', header: 'Điện thoại' },
        {
            key: 'isActive',
            header: 'Trạng thái',
            render: (u) => (
                <Badge variant={u.isActive ? 'success' : 'error'}>
                    {u.isActive ? 'Hoạt động' : 'Ngưng'}
                </Badge>
            ),
        },
        {
            key: 'lastLoginAt',
            header: 'Đăng nhập lần cuối',
            render: (u) => u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString('vi-VN') : '-',
        },
        {
            key: 'actions',
            header: '',
            render: (u) => (
                <Button variant="ghost" size="sm" onClick={() => setSelectedUser(u)}>
                    <Eye size={16} />
                </Button>
            ),
        },
    ];

    const filteredUsers = users.filter((u) =>
        u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.phone?.includes(searchQuery)
    );

    const stats = {
        total: users.length,
        active: users.filter(u => u.isActive).length,
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Quản lý tài xế</h1>
                <p className="text-gray-500 mt-1">Danh sách và thông tin tài xế</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
                <Card>
                    <CardBody className="flex items-center gap-3">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-xl">
                            <Users size={24} className="text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.total}</p>
                            <p className="text-sm text-gray-500">Tổng tài xế</p>
                        </div>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="flex items-center gap-3">
                        <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-xl">
                            <Users size={24} className="text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.active}</p>
                            <p className="text-sm text-gray-500">Đang hoạt động</p>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Search */}
            <Card>
                <CardBody>
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <Input
                            placeholder="Tìm tên, email, số điện thoại..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardBody>
            </Card>

            {/* Table */}
            <Card>
                <CardHeader>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Danh sách tài xế</h2>
                </CardHeader>
                <CardBody>
                    <DataTable
                        columns={columns}
                        data={filteredUsers}
                        loading={loading}
                        emptyMessage="Chưa có tài xế nào"
                        pagination={{ page, totalPages, onPageChange: setPage }}
                    />
                </CardBody>
            </Card>

            {/* Detail Modal */}
            <Modal
                isOpen={!!selectedUser}
                onClose={() => setSelectedUser(null)}
                title="Thông tin tài xế"
            >
                {selectedUser && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                                {selectedUser.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                                    {selectedUser.name}
                                </h3>
                                <Badge variant={selectedUser.isActive ? 'success' : 'error'}>
                                    {selectedUser.isActive ? 'Đang hoạt động' : 'Ngưng hoạt động'}
                                </Badge>
                            </div>
                        </div>
                        <div className="space-y-3 pt-4 border-t">
                            <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                                <Mail size={18} />
                                <span>{selectedUser.email}</span>
                            </div>
                            {selectedUser.phone && (
                                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                                    <Phone size={18} />
                                    <span>{selectedUser.phone}</span>
                                </div>
                            )}
                        </div>
                        <div className="pt-4 border-t">
                            <p className="text-sm text-gray-500">
                                Ngày tham gia: {new Date(selectedUser.createdAt).toLocaleDateString('vi-VN')}
                            </p>
                            {selectedUser.lastLoginAt && (
                                <p className="text-sm text-gray-500">
                                    Đăng nhập lần cuối: {new Date(selectedUser.lastLoginAt).toLocaleString('vi-VN')}
                                </p>
                            )}
                        </div>
                        <div className="flex justify-end pt-4 border-t">
                            <Button onClick={() => setSelectedUser(null)}>Đóng</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
