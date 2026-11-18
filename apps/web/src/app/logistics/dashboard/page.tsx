'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardBody, CardHeader, Badge, Select, DatePicker, DataTable } from '@/components/ui';
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
    CheckCircle2,
    MapPinned,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { analyticsApi, carrierApi } from '@/api';
import { viStatus } from '@/lib/status-labels';
import type { Carrier } from '@/types';
import { PageHead } from '@/components/studio/shell';
import { useAuthStore } from '@/stores/auth-store';

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
    const { user } = useAuthStore();
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
        <div className="space-y-4">
            <PageHead
                title="Tổng quan"
                description="Theo dõi mạng lưới giao nhận nội đô theo thời gian thực."
                extra={
                    <Link href="/doanh-nghiep/toi-uu" className="inline-flex h-10 items-center rounded-[10px] bg-[#2f6bff] px-4 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(47,107,255,0.18)]">
                        Tạo đơn giao mới
                    </Link>
                }
            />

            <section className="welcome-card">
                <div className="welcome-route" />
                <span className="inline-flex items-center gap-1.5 rounded-md border border-[rgba(111,149,255,0.28)] bg-[rgba(47,107,255,0.12)] px-2.5 py-1 text-[10px] font-bold tracking-wide text-[#9bb4ff]">
                    <Zap size={12} /> CONTROL TOWER · LIVE
                </span>
                <h2>Chào buổi sáng, {user?.name?.split(' ').pop() || 'Admin'}.</h2>
                <p>Hệ thống đang vận hành ổn định. Tỷ lệ giao đúng SLA hôm nay cao hơn so với tuần trước.</p>
                <div className="relative z-[1] flex flex-wrap gap-2">
                    <Link href="/thanh-vien/ban-do" className="inline-flex h-10 items-center rounded-[10px] bg-[#2f6bff] px-4 text-sm font-semibold text-white">
                        Mở bản đồ vận hành
                    </Link>
                    <Link href="/he-thong/du-lieu" className="inline-flex h-10 items-center rounded-[10px] border border-white/25 px-4 text-sm font-semibold text-white">
                        Xuất báo cáo ngày
                    </Link>
                </div>
            </section>

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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                    { title: 'Đơn hàng hôm nay', value: summary?.orders?.total ?? 0, icon: <Package size={17} />, tone: 'blue', trend: `${vehicleAvailablePct}% đội xe` },
                    { title: 'Xe sẵn sàng', value: availableVehicles, icon: <CheckCircle2 size={17} />, tone: 'navy', trend: `${vehicleTotal} tổng` },
                    { title: 'Tài xế / đội xe', value: vehicleTotal, icon: <MapPinned size={17} />, tone: 'orange', trend: 'Trực tuyến' },
                    { title: 'CO₂ (tấn)', value: co2Tons, icon: <Leaf size={17} />, tone: 'purple', trend: `${summary?.operations?.unassignedOrders ?? 0} đơn chờ` },
                ].map((item) => (
                    <article className="metric-card" key={item.title}>
                        <div className="flex items-start justify-between">
                            <span className={`metric-icon ${item.tone}`}>{item.icon}</span>
                            <span className="rounded-md bg-[#eaf0ff] px-2 py-0.5 text-[8px] font-extrabold text-[#2f6bff]">{item.trend}</span>
                        </div>
                        <p className="mt-4 text-xs text-[#66728b]">{item.title}</p>
                        <p className="mt-1 text-[22px] font-extrabold tracking-tight text-[#0b1b3a]">{item.value}</p>
                    </article>
                ))}
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
                        <CardBody>
                            <DataTable
                                pagination={false}
                                data={Object.entries(summary.orders.byStatus).map(([status, count]) => ({ id: status, status, count }))}
                                columns={[
                                    { key: 'status', header: 'Trạng thái', render: (r) => <Badge variant={statusBadgeVariant[r.status] || 'default'}>{viStatus(r.status)}</Badge> },
                                    { key: 'count', header: 'Số', className: 'text-right' },
                                ]}
                            />
                        </CardBody>
                    </Card>
                )}

                {summary?.vehicles?.byStatus && (
                    <Card>
                        <CardHeader>
                            <h2 className="text-sm font-semibold text-slate-800 dark:text-white">Xe theo trạng thái</h2>
                        </CardHeader>
                        <CardBody>
                            <DataTable
                                pagination={false}
                                data={Object.entries(summary.vehicles.byStatus).map(([status, count]) => ({ id: status, status, count }))}
                                columns={[
                                    { key: 'status', header: 'Trạng thái', render: (r) => <Badge variant={statusBadgeVariant[r.status] || 'default'}>{viStatus(r.status)}</Badge> },
                                    { key: 'count', header: 'Số', className: 'text-right' },
                                ]}
                            />
                        </CardBody>
                    </Card>
                )}

                {summary?.routes?.byStatus && (
                    <Card>
                        <CardHeader>
                            <h2 className="text-sm font-semibold text-slate-800 dark:text-white">Tuyến theo trạng thái</h2>
                        </CardHeader>
                        <CardBody>
                            <DataTable
                                pagination={false}
                                data={Object.entries(summary.routes.byStatus).map(([status, count]) => ({ id: status, status, count }))}
                                columns={[
                                    { key: 'status', header: 'Trạng thái', render: (r) => <Badge variant={statusBadgeVariant[r.status] || 'default'}>{viStatus(r.status)}</Badge> },
                                    { key: 'count', header: 'Số', className: 'text-right' },
                                ]}
                            />
                        </CardBody>
                    </Card>
                )}
            </div>

            {/* Xu hướng theo thời gian */}
            <Card>
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="flex shrink-0 items-center gap-2 text-sm font-semibold text-slate-800 dark:text-white">
                        <TrendingUp size={16} /> Xu hướng đơn hàng & CO₂
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                        <div className="w-full min-w-[140px] sm:w-40">
                            <Select
                                options={[{ value: '', label: 'Toàn nền tảng' }, ...carriers.map((c) => ({ value: String(c.id), label: c.name }))]}
                                value={carrierFilter}
                                onChange={setCarrierFilter}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-[150px] shrink-0">
                                <DatePicker value={fromDate} onChange={setFromDate} />
                            </div>
                            <span className="shrink-0 text-sm text-slate-400">–</span>
                            <div className="w-[150px] shrink-0">
                                <DatePicker value={toDate} onChange={setToDate} />
                            </div>
                        </div>
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
                            href="/he-thong/nguoi-dung"
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
