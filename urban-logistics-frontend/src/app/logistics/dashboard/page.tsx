'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardBody, CardHeader, Badge, Select, DatePicker } from '@/components/ui';
import {
    Package,
    Truck,
    Leaf,
    AlertTriangle,
    Zap,
    Route as RouteIcon,
    Warehouse,
    Gauge,
    TrendingUp,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { analyticsApi, carrierApi } from '@/lib/api';
import { viStatus } from '@/lib/status-labels';
import type { Carrier } from '@/types';

interface TrendPoint {
    snapshotDate: string;
    ordersTotal: number;
    ordersDelivered: number;
    estimatedCo2Grams: number | null;
}

function toDateInputValue(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

type PlatformSummary = {
    orders?: { total?: number; byStatus?: Record<string, number> };
    vehicles?: { byStatus?: Record<string, number> };
    routes?: { byStatus?: Record<string, number> };
    environment?: { estimatedCo2GramsTotal?: number };
    operations?: { unassignedOrders?: number; telemetryPointsLast24h?: number };
};

const statusBadgeVariant: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
    pending: 'warning',
    assigned: 'info',
    in_transit: 'info',
    delivered: 'success',
    failed: 'error',
    cancelled: 'error',
    available: 'success',
    in_use: 'info',
    maintenance: 'warning',
    planned: 'default',
    in_progress: 'info',
    completed: 'success',
};

function sumValues(obj?: Record<string, number>): number {
    return obj ? Object.values(obj).reduce((a, b) => a + b, 0) : 0;
}

export default function LogisticsDashboard() {
    const [summary, setSummary] = useState<PlatformSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [summaryErr, setSummaryErr] = useState(false);

    const [carriers, setCarriers] = useState<Carrier[]>([]);
    const [carrierFilter, setCarrierFilter] = useState('');
    const [fromDate, setFromDate] = useState(() => toDateInputValue(new Date(Date.now() - 29 * 86400000)));
    const [toDate, setToDate] = useState(() => toDateInputValue(new Date()));
    const [trend, setTrend] = useState<TrendPoint[]>([]);
    const [trendLoading, setTrendLoading] = useState(true);

    useEffect(() => {
        analyticsApi
            .getPlatformSummary()
            .then((r) => {
                setSummary(r.data);
                setSummaryErr(false);
            })
            .catch(() => {
                setSummary(null);
                setSummaryErr(true);
            })
            .finally(() => setLoading(false));
        carrierApi.getAll({ limit: 100 }).then((r) => setCarriers(r.data.data ?? r.data)).catch(() => setCarriers([]));
    }, []);

    useEffect(() => {
        setTrendLoading(true);
        analyticsApi
            .getTrend({
                carrierId: carrierFilter ? Number(carrierFilter) : undefined,
                from: fromDate ? new Date(fromDate).toISOString() : undefined,
                to: toDate ? new Date(toDate).toISOString() : undefined,
            })
            .then((r) => setTrend(r.data ?? []))
            .catch(() => setTrend([]))
            .finally(() => setTrendLoading(false));
    }, [carrierFilter, fromDate, toDate]);

    const chartData = trend.map((t) => ({
        date: new Date(t.snapshotDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
        'Tổng đơn': t.ordersTotal,
        'Đã giao': t.ordersDelivered,
        'CO₂ (kg)': t.estimatedCo2Grams ? Math.round(t.estimatedCo2Grams / 1000) : 0,
    }));

    const vehicleTotal = sumValues(summary?.vehicles?.byStatus);
    const routeTotal = sumValues(summary?.routes?.byStatus);
    const availableVehicles = summary?.vehicles?.byStatus?.available || 0;
    const vehicleAvailablePct = vehicleTotal > 0 ? Math.round((availableVehicles / vehicleTotal) * 100) : 0;

    const co2Tons = summary?.environment?.estimatedCo2GramsTotal
        ? (summary.environment.estimatedCo2GramsTotal / 1_000_000).toFixed(2)
        : '0';

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-500">Đang tải dữ liệu...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Dashboard</h1>
                <p className="text-slate-500 mt-1">Tổng quan hệ thống logistics đô thị</p>
            </div>

            {summaryErr && (
                <Card className="border-yellow-300 dark:border-yellow-700">
                    <CardBody className="flex items-start gap-3">
                        <AlertTriangle size={20} className="text-yellow-600 mt-0.5" />
                        <div>
                            <p className="font-medium text-slate-800 dark:text-white">Không thể tải dữ liệu</p>
                            <p className="text-sm text-slate-500">Vui lòng kiểm tra kết nối API hoặc thử lại sau.</p>
                        </div>
                    </CardBody>
                </Card>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardBody className="flex items-center gap-3">
                        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl">
                            <Package size={24} className="text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800 dark:text-white">
                                {summary?.orders?.total ?? 0}
                            </p>
                            <p className="text-sm text-slate-500">Tổng đơn hàng</p>
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody className="flex items-center gap-3">
                        <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-xl">
                            <Truck size={24} className="text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800 dark:text-white">{vehicleTotal}</p>
                            <p className="text-sm text-slate-500">Đội xe ({vehicleAvailablePct}% sẵn sàng)</p>
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody className="flex items-center gap-3">
                        <div className="p-3 bg-yellow-100 dark:bg-yellow-900/50 rounded-xl">
                            <Leaf size={24} className="text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800 dark:text-white">{co2Tons}</p>
                            <p className="text-sm text-slate-500">Phát thải CO₂ (tấn)</p>
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody className="flex items-center gap-3">
                        <div className="p-3 bg-red-100 dark:bg-red-900/50 rounded-xl">
                            <AlertTriangle size={24} className="text-red-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800 dark:text-white">
                                {summary?.operations?.unassignedOrders ?? 0}
                            </p>
                            <p className="text-sm text-slate-500">Đơn chờ điều phối</p>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Secondary stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card>
                    <CardBody className="flex items-center gap-3">
                        <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-xl">
                            <RouteIcon size={24} className="text-purple-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800 dark:text-white">{routeTotal}</p>
                            <p className="text-sm text-slate-500">Tổng tuyến (routes)</p>
                        </div>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="flex items-center gap-3">
                        <div className="p-3 bg-cyan-100 dark:bg-cyan-900/50 rounded-xl">
                            <Zap size={24} className="text-cyan-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800 dark:text-white">
                                {summary?.operations?.telemetryPointsLast24h ?? 0}
                            </p>
                            <p className="text-sm text-slate-500">Telemetry (24h)</p>
                        </div>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="flex items-center gap-3">
                        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl">
                            <Gauge size={24} className="text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800 dark:text-white">{availableVehicles}</p>
                            <p className="text-sm text-slate-500">Xe sẵn sàng</p>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Status breakdowns */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {summary?.orders?.byStatus && (
                    <Card>
                        <CardHeader>
                            <h2 className="text-sm font-semibold text-slate-800 dark:text-white">Đơn hàng theo trạng thái</h2>
                        </CardHeader>
                        <CardBody className="space-y-2">
                            {Object.entries(summary.orders.byStatus).map(([status, count]) => (
                                <div key={status} className="flex items-center justify-between">
                                    <Badge variant={statusBadgeVariant[status] || 'default'}>{viStatus(status)}</Badge>
                                    <span className="font-semibold text-slate-800 dark:text-white">{count}</span>
                                </div>
                            ))}
                        </CardBody>
                    </Card>
                )}

                {summary?.vehicles?.byStatus && (
                    <Card>
                        <CardHeader>
                            <h2 className="text-sm font-semibold text-slate-800 dark:text-white">Xe theo trạng thái</h2>
                        </CardHeader>
                        <CardBody className="space-y-2">
                            {Object.entries(summary.vehicles.byStatus).map(([status, count]) => (
                                <div key={status} className="flex items-center justify-between">
                                    <Badge variant={statusBadgeVariant[status] || 'default'}>{viStatus(status)}</Badge>
                                    <span className="font-semibold text-slate-800 dark:text-white">{count}</span>
                                </div>
                            ))}
                        </CardBody>
                    </Card>
                )}

                {summary?.routes?.byStatus && (
                    <Card>
                        <CardHeader>
                            <h2 className="text-sm font-semibold text-slate-800 dark:text-white">Tuyến theo trạng thái</h2>
                        </CardHeader>
                        <CardBody className="space-y-2">
                            {Object.entries(summary.routes.byStatus).map(([status, count]) => (
                                <div key={status} className="flex items-center justify-between">
                                    <Badge variant={statusBadgeVariant[status] || 'default'}>{viStatus(status)}</Badge>
                                    <span className="font-semibold text-slate-800 dark:text-white">{count}</span>
                                </div>
                            ))}
                        </CardBody>
                    </Card>
                )}
            </div>

            {/* Xu hướng theo thời gian */}
            <Card>
                <CardHeader className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-white">
                        <TrendingUp size={16} /> Xu hướng đơn hàng & CO₂
                    </h2>
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="w-44">
                            <Select
                                options={[{ value: '', label: 'Toàn nền tảng' }, ...carriers.map((c) => ({ value: String(c.id), label: c.name }))]}
                                value={carrierFilter}
                                onChange={setCarrierFilter}
                            />
                        </div>
                        <DatePicker value={fromDate} onChange={setFromDate} />
                        <span className="text-sm text-slate-400">–</span>
                        <DatePicker value={toDate} onChange={setToDate} />
                    </div>
                </CardHeader>
                <CardBody>
                    {trendLoading ? (
                        <p className="py-8 text-center text-sm text-slate-500">Đang tải xu hướng...</p>
                    ) : chartData.length === 0 ? (
                        <p className="py-8 text-center text-sm text-slate-500">
                            Chưa có dữ liệu snapshot trong khoảng thời gian này. Gọi POST /analytics/snapshot để ghi dữ liệu ngày hôm nay.
                        </p>
                    ) : (
                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" fontSize={12} />
                                    <YAxis fontSize={12} />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="Tổng đơn" stroke="#3B82F6" strokeWidth={2} />
                                    <Line type="monotone" dataKey="Đã giao" stroke="#10B981" strokeWidth={2} />
                                    <Line type="monotone" dataKey="CO₂ (kg)" stroke="#F59E0B" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </CardBody>
            </Card>

            {/* Quick actions */}
            <Card>
                <CardHeader>
                    <h2 className="text-sm font-semibold text-slate-800 dark:text-white">Truy cập nhanh</h2>
                </CardHeader>
                <CardBody>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <Link
                            href="/logistics/facilities"
                            className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-md hover:border-indigo-300 transition-all text-center"
                        >
                            <Warehouse size={24} className="text-indigo-600" />
                            <span className="text-sm text-slate-700 dark:text-slate-300">Cơ sở logistics</span>
                        </Link>
                        <Link
                            href="/logistics/users"
                            className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-md hover:border-indigo-300 transition-all text-center"
                        >
                            <Truck size={24} className="text-green-600" />
                            <span className="text-sm text-slate-700 dark:text-slate-300">Người dùng</span>
                        </Link>
                        <Link
                            href="/logistics/integrations"
                            className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-md hover:border-indigo-300 transition-all text-center"
                        >
                            <Zap size={24} className="text-purple-600" />
                            <span className="text-sm text-slate-700 dark:text-slate-300">API Keys</span>
                        </Link>
                        <Link
                            href="/logistics/settings"
                            className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-md hover:border-indigo-300 transition-all text-center"
                        >
                            <Gauge size={24} className="text-yellow-600" />
                            <span className="text-sm text-slate-700 dark:text-slate-300">Cài đặt</span>
                        </Link>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
}
