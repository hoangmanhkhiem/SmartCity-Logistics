'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, CardBody, CardHeader, DataTable, Badge, Tag, Button, Input, Select } from '@/components/ui';
import { integrationsApi, carrierApi } from '@/lib/api';
import { Plug, Plus, Copy, ShoppingBag, Link2, ShieldCheck } from 'lucide-react';
import type { Column } from '@/components/ui';
import type { Carrier } from '@/types';
import { formatDateTime } from '@/lib/utils';

type ClientRow = {
    id: number;
    name: string;
    carrierId?: number | null;
    keyPrefix: string;
    isActive: boolean;
    createdAt: string;
    _count?: { orders: number };
};

export default function LogisticsIntegrationsPage() {
    const [clients, setClients] = useState<ClientRow[]>([]);
    const [carriers, setCarriers] = useState<Carrier[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [name, setName] = useState('');
    const [carrierId, setCarrierId] = useState('');
    const [createdKey, setCreatedKey] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

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
        carrierApi.getAll({ limit: 100 }).then((res) => setCarriers(res.data.data ?? res.data)).catch(() => setCarriers([]));
    }, [load]);

    const carrierName = (id?: number | null) => carriers.find((c) => c.id === id)?.name;

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        setCreating(true);
        try {
            const res = await integrationsApi.createApiClient(name.trim(), carrierId ? Number(carrierId) : undefined);
            setCreatedKey(res.data.apiKey);
            setName('');
            setCarrierId('');
            load();
        } catch (err) {
            console.error(err);
        } finally {
            setCreating(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    const columns: Column<ClientRow>[] = [
        {
            key: 'name',
            header: 'Tên đối tác',
            render: (c) => (
                <div>
                    <p className="font-medium text-slate-800 dark:text-white">{c.name}</p>
                    <div className="flex gap-1 mt-0.5">
                        <Tag color="blue">B2B Partner</Tag>
                        {c.carrierId && <Tag color="purple">{carrierName(c.carrierId) ?? `Carrier #${c.carrierId}`}</Tag>}
                    </div>
                </div>
            ),
        },
        {
            key: 'keyPrefix',
            header: 'Key Prefix',
            render: (c) => (
                <code className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 text-xs">
                    {c.keyPrefix}…
                </code>
            ),
        },
        {
            key: 'orders',
            header: 'Đơn qua API',
            render: (c) => (
                <div className="flex items-center gap-2">
                    <ShoppingBag size={16} className="text-indigo-500" />
                    <span>{c._count?.orders ?? 0}</span>
                </div>
            ),
        },
        {
            key: 'createdAt',
            header: 'Ngày tạo',
            render: (c) => formatDateTime(c.createdAt),
        },
        {
            key: 'isActive',
            header: 'Trạng thái',
            render: (c) => (
                <Badge variant={c.isActive ? 'success' : 'default'}>
                    {c.isActive ? 'Hoạt động' : 'Vô hiệu'}
                </Badge>
            ),
        },
    ];

    const totalOrders = clients.reduce((sum, c) => sum + (c._count?.orders ?? 0), 0);
    const activeClients = clients.filter((c) => c.isActive).length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">API Tích hợp (B2B)</h1>
                <p className="text-slate-500 mt-1">
                    Tạo khóa cho shop / sàn TMĐT — gọi{' '}
                    <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-xs">
                        POST /api/v1/partner/orders
                    </code>{' '}
                    với header{' '}
                    <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-xs">
                        X-Api-Key
                    </code>
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                    <CardBody className="flex items-center gap-3">
                        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl">
                            <Plug size={24} className="text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800 dark:text-white">{clients.length}</p>
                            <p className="text-sm text-slate-500">Tổng API Clients</p>
                        </div>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="flex items-center gap-3">
                        <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-xl">
                            <Link2 size={24} className="text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800 dark:text-white">{activeClients}</p>
                            <p className="text-sm text-slate-500">Đang hoạt động</p>
                        </div>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="flex items-center gap-3">
                        <div className="p-3 bg-yellow-100 dark:bg-yellow-900/50 rounded-xl">
                            <ShoppingBag size={24} className="text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800 dark:text-white">{totalOrders}</p>
                            <p className="text-sm text-slate-500">Tổng đơn qua API</p>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Created key alert */}
            {createdKey && (
                <Card className="border-yellow-300 dark:border-yellow-700">
                    <CardBody className="space-y-3">
                        <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400 font-medium">
                            <ShieldCheck size={18} />
                            Lưu ngay — chỉ hiện một lần!
                        </div>
                        <code className="block p-3 rounded-lg bg-slate-50 dark:bg-slate-900 break-all text-sm">
                            {createdKey}
                        </code>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => copyToClipboard(createdKey)}>
                                <Copy size={14} className="mr-1" />
                                {copied ? 'Đã sao chép' : 'Sao chép'}
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setCreatedKey(null)}>
                                Đã lưu
                            </Button>
                        </div>
                    </CardBody>
                </Card>
            )}

            {/* Create form */}
            <Card>
                <CardHeader>
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                        <Plus size={18} /> Tạo API Client mới
                    </h2>
                </CardHeader>
                <CardBody>
                    <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-3">
                        <div className="flex-1 min-w-[220px]">
                            <Input
                                label="Tên đối tác"
                                placeholder="vd: Shop Shopee ABC"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div className="w-56">
                            <Select
                                label="Carrier nhận đơn (tuỳ chọn)"
                                placeholder="Không gán carrier"
                                options={carriers.map((c) => ({ value: String(c.id), label: c.name }))}
                                value={carrierId}
                                onChange={setCarrierId}
                            />
                        </div>
                        <Button type="submit" isLoading={creating}>
                            <Plus size={16} className="mr-1" />
                            Tạo khóa
                        </Button>
                    </form>
                </CardBody>
            </Card>

            {/* Table */}
            <Card>
                <CardHeader>
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Danh sách API Clients</h2>
                </CardHeader>
                <CardBody>
                    <DataTable
                        columns={columns}
                        data={clients}
                        loading={loading}
                        emptyMessage="Chưa có client nào"
                    />
                </CardBody>
            </Card>
        </div>
    );
}
