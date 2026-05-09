'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, CardBody, CardHeader, Button, Input, DataTable } from '@/components/ui';
import { integrationsApi } from '@/lib/api';
import { KeyRound, Plus } from 'lucide-react';
import type { Column } from '@/components/ui';

type ClientRow = {
    id: string;
    name: string;
    keyPrefix: string;
    isActive: boolean;
    createdAt: string;
    _count?: { orders: number };
};

export default function LogisticsIntegrationsPage() {
    const [clients, setClients] = useState<ClientRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [newName, setNewName] = useState('');
    const [createdKey, setCreatedKey] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await integrationsApi.listApiClients();
            setClients(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;
        try {
            const res = await integrationsApi.createApiClient(newName.trim());
            setCreatedKey(res.data.apiKey);
            setNewName('');
            load();
        } catch (err) {
            console.error(err);
        }
    };

    const columns: Column<ClientRow>[] = [
        { key: 'name', header: 'Tên đối tác' },
        { key: 'keyPrefix', header: 'Key prefix', render: (c) => <span className="font-mono text-xs">{c.keyPrefix}…</span> },
        {
            key: '_count',
            header: 'Đơn qua API',
            render: (c) => c._count?.orders ?? 0,
        },
        {
            key: 'createdAt',
            header: 'Tạo lúc',
            render: (c) => new Date(c.createdAt).toLocaleString('vi-VN'),
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <KeyRound className="text-amber-600" />
                    API tích hợp (B2B)
                </h1>
                <p className="text-gray-500 mt-1">
                    Tạo khóa cho shop / sàn TMĐT — gọi{' '}
                    <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">POST /api/v1/partner/orders</code> với header{' '}
                    <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">X-Api-Key</code>.
                </p>
            </div>

            {createdKey && (
                <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-4">
                    <p className="font-semibold text-amber-900 dark:text-amber-100">Lưu ngay — chỉ hiện một lần:</p>
                    <code className="block mt-2 p-2 bg-white dark:bg-gray-900 rounded text-sm break-all">{createdKey}</code>
                    <Button size="sm" variant="outline" className="mt-2" onClick={() => setCreatedKey(null)}>
                        Đã copy
                    </Button>
                </div>
            )}

            <Card>
                <CardHeader>
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Plus size={18} />
                        Tạo API client mới
                    </h2>
                </CardHeader>
                <CardBody>
                    <form onSubmit={handleCreate} className="flex flex-wrap gap-3 items-end">
                        <div className="flex-1 min-w-[200px]">
                            <Input
                                label="Tên (vd: Shop Shopee ABC)"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                            />
                        </div>
                        <Button type="submit">Tạo khóa</Button>
                    </form>
                </CardBody>
            </Card>

            <Card>
                <CardHeader>
                    <h2 className="text-lg font-semibold">Danh sách client</h2>
                </CardHeader>
                <CardBody>
                    <DataTable columns={columns} data={clients} loading={loading} emptyMessage="Chưa có client" />
                </CardBody>
            </Card>
        </div>
    );
}
