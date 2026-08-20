'use client';

import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, Badge, Button, DatePicker } from '@/components/ui';
import { analyticsApi, carrierApi } from '@/lib/api';
import { viStatus } from '@/lib/status-labels';
import { formatCurrency } from '@/lib/utils';
import { BarChart3, Leaf, Truck, Package, Building2, Route as RouteIcon, Download } from 'lucide-react';

interface ComplianceRow {
    carrierId: number;
    carrierName: string;
    ordersTotal: number;
    ordersDelivered: number;
    ordersFailed: number;
    routesCompleted: number;
    totalDistanceKm: number;
    estimatedCo2Grams: number;
    codCollectedTotal: number;
    successRate: number | null;
}

interface ComplianceReport {
    from: string;
    to: string;
    totals: { ordersTotal: number; ordersDelivered: number; estimatedCo2Grams: number; codCollectedTotal: number; successRate: number | null };
    byCarrier: ComplianceRow[];
}

function toDateInputValue(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function downloadCsv(filename: string, rows: string[][]) {
    const csv = rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

type PlatformSummary = {
    orders?: { total?: number; byStatus?: Record<string, number> };
    vehicles?: { byStatus?: Record<string, number> };
    routes?: { byStatus?: Record<string, number> };
    environment?: { estimatedCo2GramsTotal?: number; avgRouteDistanceKm?: number };
    operations?: { unassignedOrders?: number; telemetryPointsLast24h?: number };
};

const statusBadgeVariant: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
    pending: 'warning',
    assigned: 'info',
    in_transit: 'info',
    delivered: 'success',
    failed: 'error',
    cancelled: 'error',
    planned: 'default',
    in_progress: 'info',
    completed: 'success',
};

export default function RegulatorReportsPage() {
    const [summary, setSummary] = useState<PlatformSummary | null>(null);
    const [carrierCount, setCarrierCount] = useState(0);
    const [vehicleTotal, setVehicleTotal] = useState(0);
    const [loading, setLoading] = useState(true);

    const [fromDate, setFromDate] = useState(() => toDateInputValue(new Date(Date.now() - 29 * 86400000)));
    const [toDate, setToDate] = useState(() => toDateInputValue(new Date()));
    const [report, setReport] = useState<ComplianceReport | null>(null);
    const [reportLoading, setReportLoading] = useState(true);

    useEffect(() => {
        setReportLoading(true);
        analyticsApi
            .getComplianceReport({
                from: fromDate ? new Date(fromDate).toISOString() : undefined,
                to: toDate ? new Date(toDate).toISOString() : undefined,
            })
            .then((r) => setReport(r.data))
            .catch(() => setReport(null))
            .finally(() => setReportLoading(false));
    }, [fromDate, toDate]);

    const handleExportCsv = () => {
        if (!report) return;
        const rows: string[][] = [
            ['Hãng vận chuyển', 'Tổng đơn', 'Đã giao', 'Thất bại', 'Tỷ lệ thành công (%)', 'Chuyến hoàn tất', 'Quãng đường (km)', 'CO2 (kg)', 'COD thu (VNĐ)'],
            ...report.byCarrier.map((r) => [
                r.carrierName,
                String(r.ordersTotal),
                String(r.ordersDelivered),
                String(r.ordersFailed),
                r.successRate != null ? String(r.successRate) : '-',
                String(r.routesCompleted),
                r.totalDistanceKm.toFixed(1),
                (r.estimatedCo2Grams / 1000).toFixed(2),
                String(r.codCollectedTotal),
            ]),
            [
                'TỔNG',
                String(report.totals.ordersTotal),
                String(report.totals.ordersDelivered),
                '',
                report.totals.successRate != null ? String(report.totals.successRate) : '-',
                '',
                '',
                (report.totals.estimatedCo2Grams / 1000).toFixed(2),
                String(report.totals.codCollectedTotal),
            ],
        ];
        downloadCsv(`bao-cao-tuan-thu_${fromDate}_${toDate}.csv`, rows);
    };

    useEffect(() => {
        Promise.all([
            analyticsApi.getPlatformSummary(),
            carrierApi.getAll({ limit: 1 }),
        ]).then(([summaryRes, carrierRes]) => {
            setSummary(summaryRes.data);
            setCarrierCount(carrierRes.data.meta?.total ?? 0);
            const byStatus: Record<string, number> = summaryRes.data?.vehicles?.byStatus ?? {};
            setVehicleTotal(Object.values(byStatus).reduce((a, b) => a + b, 0));
        }).catch((e) => console.error(e)).finally(() => setLoading(false));
    }, []);

    const ordersTotal = summary?.orders?.total ?? 0;
    const deliveredCount = summary?.orders?.byStatus?.delivered ?? 0;
    const failedCount = summary?.orders?.byStatus?.failed ?? 0;
    const successRate = ordersTotal > 0 ? ((deliveredCount / ordersTotal) * 100).toFixed(1) : '—';
    const co2Tons = summary?.environment?.estimatedCo2GramsTotal ? (summary.environment.estimatedCo2GramsTotal / 1_000_000).toFixed(2) : '0';

    const kpis = [
        { label: 'Tổng đơn hàng', value: loading ? '...' : ordersTotal, icon: <Package size={24} />, color: 'text-indigo-500', bg: 'bg-indigo-100' },
        { label: 'Tổng phương tiện', value: loading ? '...' : vehicleTotal, icon: <Truck size={24} />, color: 'text-purple-500', bg: 'bg-purple-100' },
        { label: 'Carrier đăng ký', value: loading ? '...' : carrierCount, icon: <Building2 size={24} />, color: 'text-green-500', bg: 'bg-green-100' },
        { label: 'Phát thải CO₂ (tấn)', value: loading ? '...' : co2Tons, icon: <Leaf size={24} />, color: 'text-teal-500', bg: 'bg-teal-100' },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Báo cáo & Thống kê</h1>
                <p className="text-slate-500 mt-1">Tổng hợp hoạt động toàn nền tảng — nhiều carrier</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {kpis.map((kpi, i) => (
                    <Card key={i}>
                        <CardBody className="flex items-center gap-3">
                            <div className={`p-3 ${kpi.bg} rounded-xl ${kpi.color}`}>{kpi.icon}</div>
                            <div>
                                <p className="text-2xl font-bold text-slate-800 dark:text-white">{kpi.value}</p>
                                <p className="text-sm text-slate-500">{kpi.label}</p>
                            </div>
                        </CardBody>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Đơn hàng theo trạng thái</h2>
                        <BarChart3 size={20} className="text-slate-400" />
                    </CardHeader>
                    <CardBody>
                        {!summary?.orders?.byStatus || Object.keys(summary.orders.byStatus).length === 0 ? (
                            <p className="text-sm text-slate-500">Chưa có dữ liệu</p>
                        ) : (
                            <div className="space-y-2">
                                {Object.entries(summary.orders.byStatus).map(([status, count]) => (
                                    <div key={status} className="flex items-center justify-between">
                                        <Badge variant={statusBadgeVariant[status] || 'default'}>{viStatus(status)}</Badge>
                                        <span className="font-semibold text-slate-800 dark:text-white">{count}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardBody>
                </Card>

                <Card>
                    <CardHeader className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Chuyến giao (route) theo trạng thái</h2>
                        <RouteIcon size={20} className="text-slate-400" />
                    </CardHeader>
                    <CardBody>
                        {!summary?.routes?.byStatus || Object.keys(summary.routes.byStatus).length === 0 ? (
                            <p className="text-sm text-slate-500">Chưa có dữ liệu</p>
                        ) : (
                            <div className="space-y-2">
                                {Object.entries(summary.routes.byStatus).map(([status, count]) => (
                                    <div key={status} className="flex items-center justify-between">
                                        <Badge variant={statusBadgeVariant[status] || 'default'}>{viStatus(status)}</Badge>
                                        <span className="font-semibold text-slate-800 dark:text-white">{count}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardBody>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <h2 className="text-lg font-semibold">Tóm tắt hiệu suất</h2>
                </CardHeader>
                <CardBody>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg text-center">
                            <p className="text-3xl font-bold text-indigo-600">{successRate}{successRate !== '—' && '%'}</p>
                            <p className="text-sm text-slate-500 mt-1">Tỷ lệ giao thành công</p>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg text-center">
                            <p className="text-3xl font-bold text-red-500">{failedCount}</p>
                            <p className="text-sm text-slate-500 mt-1">Đơn giao thất bại</p>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg text-center">
                            <p className="text-3xl font-bold text-purple-600">{summary?.environment?.avgRouteDistanceKm?.toFixed(1) ?? '—'}</p>
                            <p className="text-sm text-slate-500 mt-1">Km trung bình / chuyến</p>
                        </div>
                    </div>
                </CardBody>
            </Card>

            <Card>
                <CardHeader className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold">Báo cáo tuân thủ theo carrier (CO₂ + kinh tế)</h2>
                    <div className="flex flex-wrap items-center gap-2">
                        <DatePicker value={fromDate} onChange={setFromDate} />
                        <span className="text-sm text-slate-400">–</span>
                        <DatePicker value={toDate} onChange={setToDate} />
                        <Button variant="outline" onClick={handleExportCsv} disabled={!report || report.byCarrier.length === 0}>
                            <Download size={16} className="mr-1 inline" /> Xuất CSV
                        </Button>
                    </div>
                </CardHeader>
                <CardBody>
                    {reportLoading ? (
                        <p className="py-8 text-center text-sm text-slate-500">Đang tải báo cáo...</p>
                    ) : !report || report.byCarrier.length === 0 ? (
                        <p className="py-8 text-center text-sm text-slate-500">
                            Chưa có dữ liệu snapshot trong khoảng thời gian này.
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200 text-left text-slate-500 dark:border-slate-700">
                                        <th className="py-2 pr-4">Hãng</th>
                                        <th className="py-2 pr-4 text-right">Tổng đơn</th>
                                        <th className="py-2 pr-4 text-right">Đã giao</th>
                                        <th className="py-2 pr-4 text-right">Tỷ lệ TC</th>
                                        <th className="py-2 pr-4 text-right">Quãng đường</th>
                                        <th className="py-2 pr-4 text-right">CO₂ (kg)</th>
                                        <th className="py-2 pr-4 text-right">COD thu</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {report.byCarrier.map((r) => (
                                        <tr key={r.carrierId} className="border-b border-slate-100 dark:border-slate-800">
                                            <td className="py-2 pr-4 font-medium text-slate-800 dark:text-white">{r.carrierName}</td>
                                            <td className="py-2 pr-4 text-right">{r.ordersTotal}</td>
                                            <td className="py-2 pr-4 text-right">{r.ordersDelivered}</td>
                                            <td className="py-2 pr-4 text-right">
                                                {r.successRate != null ? <Badge variant={r.successRate >= 80 ? 'success' : r.successRate >= 50 ? 'warning' : 'error'}>{r.successRate}%</Badge> : '—'}
                                            </td>
                                            <td className="py-2 pr-4 text-right">{r.totalDistanceKm.toFixed(1)} km</td>
                                            <td className="py-2 pr-4 text-right">{(r.estimatedCo2Grams / 1000).toFixed(2)}</td>
                                            <td className="py-2 pr-4 text-right">{formatCurrency(r.codCollectedTotal)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="font-semibold text-slate-800 dark:text-white">
                                        <td className="py-2 pr-4">TỔNG</td>
                                        <td className="py-2 pr-4 text-right">{report.totals.ordersTotal}</td>
                                        <td className="py-2 pr-4 text-right">{report.totals.ordersDelivered}</td>
                                        <td className="py-2 pr-4 text-right">{report.totals.successRate != null ? `${report.totals.successRate}%` : '—'}</td>
                                        <td className="py-2 pr-4 text-right">—</td>
                                        <td className="py-2 pr-4 text-right">{(report.totals.estimatedCo2Grams / 1000).toFixed(2)}</td>
                                        <td className="py-2 pr-4 text-right">{formatCurrency(report.totals.codCollectedTotal)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}
                </CardBody>
            </Card>
        </div>
    );
}
