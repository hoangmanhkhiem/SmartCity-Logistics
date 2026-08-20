'use client';

import { useState } from 'react';
import { Card, CardBody, CardHeader, Button, Input, Badge } from '@/components/ui';
import { trackingApi } from '@/lib/api';
import { viStatus } from '@/lib/status-labels';
import { formatDateTime, formatCurrency } from '@/lib/utils';
import { Package, Search, MapPin, Truck, User, Route, ChevronDown } from 'lucide-react';

type TrackingStop = {
    id?: number;
    sequence?: number;
    type?: string;
    address?: string | null;
    status?: string;
    codAmountDue?: number | null;
    codCollected?: boolean;
    route?: {
        code?: string;
        status?: string;
        vehicle?: { plate?: string; type?: string };
        shipper?: { name?: string; phone?: string };
    };
};

type OrderDetail = {
    id?: number;
    orderNumber?: string;
    trackingNo?: string;
    status?: string;
    pickupAddress?: string | null;
    deliveryAddress?: string | null;
    pickupPhone?: string | null;
    deliveryPhone?: string | null;
    weightKg?: number | null;
    itemCount?: number | null;
    codAmount?: number | null;
    createdAt?: string;
    stops?: TrackingStop[];
};

type SearchResult =
    | { matchType: string; order: OrderDetail }
    | { matchType: string; multiple: true; orders: OrderDetail[] };

interface ShipmentTrackingLookupProps {
    title?: string;
    description?: string;
}

function StopRow({ stop }: { stop: TrackingStop }) {
    const isPickup = stop.type === 'pickup';
    return (
        <div className="flex gap-3">
            <div
                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                    isPickup ? 'bg-emerald-600' : 'bg-indigo-600'
                }`}
            >
                {isPickup ? 'L' : 'G'}
            </div>
            <div className="min-w-0 flex-1 border-b border-slate-100 pb-3 dark:border-slate-800">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    {isPickup ? 'Điểm lấy' : 'Điểm giao'}
                </p>
                <p className="text-sm text-slate-900 dark:text-slate-100">{stop.address || '—'}</p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    {stop.status && (
                        <Badge variant="secondary" className="text-xs">
                            {viStatus(stop.status)}
                        </Badge>
                    )}
                    {!isPickup && stop.codAmountDue != null && stop.codAmountDue > 0 && (
                        <Badge variant={stop.codCollected ? 'success' : 'warning'} className="text-xs">
                            COD {formatCurrency(stop.codAmountDue)} {stop.codCollected ? '· đã thu' : ''}
                        </Badge>
                    )}
                </div>
            </div>
        </div>
    );
}

function OrderDetailPanel({ o }: { o: OrderDetail }) {
    const stops = [...(o.stops ?? [])].sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));
    const route = stops.find((s) => s.route)?.route;

    return (
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/40">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                <div>
                    <p className="text-xs font-medium text-slate-500">Mã vận đơn</p>
                    <p className="font-mono text-lg font-semibold text-slate-900 dark:text-white">{o.trackingNo ?? '—'}</p>
                    {o.createdAt && <p className="mt-1 text-xs text-slate-500">Tạo: {formatDateTime(o.createdAt)}</p>}
                </div>
                {o.status && (
                    <Badge variant="info" className="text-sm">
                        {viStatus(o.status)}
                    </Badge>
                )}
            </div>

            <section>
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
                    <Package size={16} className="text-indigo-600" />
                    Đơn hàng
                </h3>
                <div className="grid gap-3 rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50 sm:grid-cols-2">
                    <div>
                        <p className="text-xs text-slate-500">Mã đơn</p>
                        <p className="font-medium text-slate-900 dark:text-white">{o.orderNumber ?? '—'}</p>
                    </div>
                    <div className="sm:text-right">
                        {o.codAmount != null && o.codAmount > 0 && (
                            <>
                                <p className="text-xs text-slate-500">Thu hộ (COD)</p>
                                <p className="font-medium text-slate-900 dark:text-white">{formatCurrency(o.codAmount)}</p>
                            </>
                        )}
                    </div>
                    <div className="sm:col-span-2 space-y-2">
                        <div className="flex gap-2">
                            <MapPin size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                            <div>
                                <p className="text-xs text-slate-500">Lấy hàng</p>
                                <p className="text-sm text-slate-800 dark:text-slate-200">{o.pickupAddress || '—'}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <MapPin size={16} className="mt-0.5 shrink-0 text-indigo-600" />
                            <div>
                                <p className="text-xs text-slate-500">Giao hàng</p>
                                <p className="text-sm text-slate-800 dark:text-slate-200">{o.deliveryAddress || '—'}</p>
                            </div>
                        </div>
                        {(o.pickupPhone || o.deliveryPhone) && (
                            <p className="text-xs text-slate-500">
                                {o.pickupPhone && <>Người gửi: {o.pickupPhone} </>}
                                {o.deliveryPhone && <>· Người nhận: {o.deliveryPhone}</>}
                            </p>
                        )}
                    </div>
                </div>
            </section>

            {(o.weightKg != null || o.itemCount != null) && (
                <section>
                    <h3 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-200">Thông tin lô</h3>
                    <div className="flex flex-wrap gap-3 text-sm text-slate-600 dark:text-slate-400">
                        {o.weightKg != null && <span>Khối lượng: {o.weightKg} kg</span>}
                        {o.itemCount != null && <span>Số kiện: {o.itemCount}</span>}
                    </div>
                </section>
            )}

            {stops.length > 0 && (
                <section>
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
                        <Route size={16} className="text-amber-600" />
                        Hành trình & phân công
                    </h3>
                    <div className="rounded-lg border border-slate-200 dark:border-slate-600 p-3">
                        {route && (
                            <div className="mb-3 flex flex-wrap items-center gap-2">
                                <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{route.code}</span>
                                {route.status && (
                                    <Badge variant="warning" className="text-xs">
                                        {viStatus(route.status)}
                                    </Badge>
                                )}
                            </div>
                        )}
                        <div className="space-y-3 pl-1">
                            {stops.map((stop) => (
                                <StopRow key={stop.id ?? stop.sequence} stop={stop} />
                            ))}
                        </div>

                        {route && (route.vehicle || route.shipper) && (
                            <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
                                <p className="mb-2 text-xs font-medium uppercase text-slate-500">Xe & shipper</p>
                                <div className="flex flex-wrap items-center gap-3 rounded-md bg-slate-50 px-3 py-2 dark:bg-slate-800/60">
                                    {route.vehicle?.plate && (
                                        <>
                                            <Truck size={16} className="text-slate-500" />
                                            <span className="font-mono text-sm font-medium">{route.vehicle.plate}</span>
                                            {route.vehicle.type && <span className="text-xs text-slate-500">{route.vehicle.type}</span>}
                                        </>
                                    )}
                                    {route.shipper?.name && (
                                        <>
                                            <User size={16} className="ml-2 text-slate-500" />
                                            <span className="text-sm">{route.shipper.name}</span>
                                            {route.shipper.phone && <span className="text-xs text-slate-500">{route.shipper.phone}</span>}
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            )}

            <details className="group rounded-lg border border-dashed border-slate-200 dark:border-slate-700">
                <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                    <ChevronDown size={14} className="transition-transform group-open:rotate-180" />
                    Dữ liệu gốc (JSON) — dành cho tích hợp / gỡ lỗi
                </summary>
                <pre className="max-h-48 overflow-auto border-t border-slate-100 p-3 text-[10px] leading-relaxed dark:border-slate-800">
                    {JSON.stringify(o, null, 2)}
                </pre>
            </details>
        </div>
    );
}

export function ShipmentTrackingLookup({
    title = 'Tra cứu vận đơn',
    description = 'Nhập mã vận đơn (VD: TRK…), mã đơn hàng, hoặc số điện thoại người nhận / người gửi (9 số cuối).',
}: ShipmentTrackingLookupProps) {
    const [q, setQ] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<SearchResult | null>(null);
    const [selected, setSelected] = useState<OrderDetail | null>(null);

    const runSearch = async () => {
        const trimmed = q.trim();
        if (!trimmed) return;
        setLoading(true);
        setError(null);
        setResult(null);
        setSelected(null);
        try {
            const res = await trackingApi.search(trimmed);
            const data = res.data as SearchResult;
            setResult(data);
            if ('order' in data && data.order) setSelected(data.order);
            if ('orders' in data && data.orders?.length === 1) {
                setSelected(data.orders[0]);
            }
        } catch (e: unknown) {
            const raw = (e as { response?: { data?: { message?: string | string[] } } })?.response?.data
                ?.message;
            const msg = Array.isArray(raw) ? raw.join(', ') : raw;
            setError(msg || 'Không tìm thấy hoặc lỗi mạng.');
        } finally {
            setLoading(false);
        }
    };

    const matchLabel: Record<string, string> = {
        trackingNo: 'Mã vận đơn',
        orderNumber: 'Mã đơn hàng',
        phone: 'Số điện thoại',
    };

    const renderOrderCard = (o: OrderDetail, compact?: boolean) => (
        <div
            key={String(o.trackingNo)}
            className={`rounded-lg border border-slate-200 dark:border-slate-600 p-3 space-y-1 ${compact ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800' : ''}`}
            onClick={compact ? () => setSelected(o) : undefined}
            role={compact ? 'button' : undefined}
        >
            <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono font-semibold text-slate-900 dark:text-white">{o.trackingNo}</span>
                {o.status && <Badge variant="info">{viStatus(String(o.status))}</Badge>}
            </div>
            {o.orderNumber && <p className="text-sm text-slate-600 dark:text-slate-300">Đơn: {o.orderNumber}</p>}
            {o.deliveryAddress && <p className="text-xs text-slate-500 line-clamp-2">Giao: {o.deliveryAddress}</p>}
            {(o.deliveryPhone || o.pickupPhone) && (
                <p className="text-xs text-slate-500">
                    {o.deliveryPhone && <>NH: {o.deliveryPhone} </>}
                    {o.pickupPhone && <>· NG: {o.pickupPhone}</>}
                </p>
            )}
        </div>
    );

    return (
        <Card>
            <CardHeader>
                <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                    <Package size={20} className="text-indigo-600" />
                    {title}
                </h2>
                <p className="text-sm text-slate-500 mt-1">{description}</p>
            </CardHeader>
            <CardBody className="space-y-4">
                <div className="flex flex-wrap gap-2 items-end">
                    <div className="flex-1 min-w-[220px]">
                        <Input
                            label="Mã vận đơn / mã đơn / SĐT"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="VD: TRK-xxx, ORD-xxx, 0901234567"
                            onKeyDown={(e) => e.key === 'Enter' && runSearch()}
                        />
                    </div>
                    <Button onClick={runSearch} disabled={loading || !q.trim()}>
                        <Search size={18} className="mr-1 inline" />
                        {loading ? 'Đang tra…' : 'Tra cứu'}
                    </Button>
                </div>

                {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

                {result && 'multiple' in result && result.multiple && result.orders?.length ? (
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Tìm thấy {result.orders.length} vận đơn ({matchLabel[result.matchType] || result.matchType}) — chọn một đơn:
                        </p>
                        <div className="grid gap-2 max-h-56 overflow-y-auto">
                            {result.orders.map((o) => renderOrderCard(o, true))}
                        </div>
                    </div>
                ) : null}

                {selected && (
                    <div className="space-y-3">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Kết quả tra cứu</p>
                        <OrderDetailPanel o={selected} />
                    </div>
                )}
            </CardBody>
        </Card>
    );
}
