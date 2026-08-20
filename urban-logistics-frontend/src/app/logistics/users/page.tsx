'use client';

import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, DataTable, Badge, Button, Input, Drawer, Tag } from '@/components/ui';
import { userApi } from '@/lib/api';
import { User } from '@/types';
import { Users as UsersIcon, Search, Eye, Mail, Phone, CheckCircle, XCircle } from 'lucide-react';
import type { Column } from '@/components/ui';

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await userApi.getAll({ page: 1, limit: 100 });
            setUsers(response.data.data || response.data);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setLoading(false);
        }
    };

    const columns: Column<User>[] = [
        {
            key: 'name',
            header: 'Người dùng',
            render: (u) => (
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0">
                        {u.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div className="min-w-0">
                        <p className="font-medium truncate">{u.name}</p>
                        <p className="text-xs text-slate-500 truncate">{u.email}</p>
                    </div>
                </div>
            ),
        },
        { key: 'phone', header: 'Điện thoại', render: (u) => u.phone || '—' },
        {
            key: 'role',
            header: 'Vai trò',
            render: (u) => (
                <div className="flex flex-wrap gap-1">
                    {u.memberships?.map((m, i) => (
                        <Tag key={i} color="blue">{m.role?.name || 'N/A'}</Tag>
                    ))}
                </div>
            ),
        },
        { key: 'org', header: 'Tổ chức', render: (u) => u.memberships?.[0]?.organization?.name || '—' },
        {
            key: 'isActive',
            header: 'Trạng thái',
            render: (u) => <Badge variant={u.isActive ? 'success' : 'error'}>{u.isActive ? 'Hoạt động' : 'Ngưng'}</Badge>,
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

    const filteredUsers = users.filter(
        (u) =>
            u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const activeCount = users.filter((u) => u.isActive).length;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Người dùng & Vai trò</h1>
                <p className="text-slate-500 mt-1">Quản lý tài khoản và phân quyền trên nền tảng</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                    <CardBody className="flex items-center gap-3">
                        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl">
                            <UsersIcon size={24} className="text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800 dark:text-white">{users.length}</p>
                            <p className="text-sm text-slate-500">Tổng người dùng</p>
                        </div>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="flex items-center gap-3">
                        <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-xl">
                            <CheckCircle size={24} className="text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800 dark:text-white">{activeCount}</p>
                            <p className="text-sm text-slate-500">Đang hoạt động</p>
                        </div>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="flex items-center gap-3">
                        <div className="p-3 bg-red-100 dark:bg-red-900/50 rounded-xl">
                            <XCircle size={24} className="text-red-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800 dark:text-white">{users.length - activeCount}</p>
                            <p className="text-sm text-slate-500">Ngưng hoạt động</p>
                        </div>
                    </CardBody>
                </Card>
            </div>

            <Card>
                <CardBody>
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <Input
                            placeholder="Tìm tên hoặc email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardBody>
            </Card>

            <Card>
                <CardHeader>
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Danh sách người dùng</h2>
                </CardHeader>
                <CardBody>
                    <DataTable columns={columns} data={filteredUsers} loading={loading} emptyMessage="Chưa có người dùng" />
                </CardBody>
            </Card>

            <Drawer isOpen={!!selectedUser} onClose={() => setSelectedUser(null)} title="Thông tin người dùng">
                {selectedUser && (
                    <div className="space-y-6">
                        <div className="text-center">
                            <div className="w-20 h-20 mx-auto bg-indigo-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                                {selectedUser.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <h3 className="mt-3 text-lg font-semibold text-slate-900 dark:text-white">{selectedUser.name}</h3>
                            <Badge variant={selectedUser.isActive ? 'success' : 'error'} className="mt-1">
                                {selectedUser.isActive ? 'Hoạt động' : 'Ngưng'}
                            </Badge>
                        </div>

                        <div className="space-y-3 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                            <div className="flex items-center gap-2 text-sm">
                                <Mail size={16} className="text-slate-400" />
                                <span>{selectedUser.email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <Phone size={16} className="text-slate-400" />
                                <span>{selectedUser.phone || '—'}</span>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 mb-1">Vai trò</p>
                                <div className="flex flex-wrap gap-1">
                                    {selectedUser.memberships?.map((m, i) => (
                                        <Tag key={i} color="blue">{m.role?.name || 'N/A'}</Tag>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Tổ chức</p>
                                <p className="font-medium">{selectedUser.memberships?.[0]?.organization?.name || '—'}</p>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <Button onClick={() => setSelectedUser(null)}>Đóng</Button>
                        </div>
                    </div>
                )}
            </Drawer>
        </div>
    );
}
