'use client';

import { useState } from 'react';
import { Card, CardBody, CardHeader, Button, Input, Badge } from '@/components/ui';
import { trackingApi } from '@/lib/api';
import { viStatus } from '@/lib/status-labels';
import { formatDateTime } from '@/lib/utils';
import { Package, Search, MapPin, Truck, User, Route, ChevronDown } from 'lucide-react';

type TrackingStop = {
    id?: string;
    sequence?: number;
    type?: string;
    address?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    status?: string;
};

type TrackingAssignment = {
    id?: string;
    status?: string;
    vehicle?: { plate?: string; type?: string };
    driver?: { name?: string; phone?: string } | null;
};

type TrackingLeg = {
    id?: string;
    status?: string;
    sequence?: number;
    route?: { name?: string; status?: string };
    stops?: TrackingStop[];
    assignments?: TrackingAssignment[];
};

type ShipmentDetail = {
    id?: string;
    trackingNo?: string;
    status?: string;
    weight?: number;
    volume?: number;
    itemCount?: number;
    description?: string;
    createdAt?: string;
    updatedAt?: string;
    order?: {
        orderNumber?: string;
        status?: string;
        deliveryAddress?: string;
        pickupAddress?: string;
        deliveryPhone?: string | null;
        pickupPhone?: string | null;
        createdAt?: string;
    };
    legs?: TrackingLeg[];
    error?: string;
};

type SearchResult =
    | { matchType: string; shipment: ShipmentDetail }
    | { matchType: string; multiple: true; shipments: ShipmentDetail[] };

interface ShipmentTrackingLookupProps {
    title?: string;
    description?: string;
}

function StopRow({ stop, label }: { stop: TrackingStop; label: string }) {
    const isPickup = stop.type === 'pickup';
    return (
        <div className="flex gap-3">
            <div
                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                    isPickup ? 'bg-emerald-600' : 'bg-blue-600'
                }`}
            >
                {isPickup ? 'L' : 'G'}
            </div>
            <div className="min-w-0 flex-1 border-b border-gray-100 pb-3 dark:border-gray-800">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
                <p className="text-sm text-gray-900 dark:text-gray-100">{stop.address || '—'}</p>
                {stop.status && (
                    <Badge variant="secondary" className="mt-1 text-xs">
                        {viStatus(stop.status)}
                    </Badge>
                )}
            </div>
        </div>
    );
}

function ShipmentDetailPanel({ s }: { s: ShipmentDetail }) {
    const o = s.order;
    const legs = s.legs ?? [];

    return (
        <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900/40">
            {/* Vận đơn */}
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 pb-4 dark:border-gray-800">
                <div>
                    <p className="text-xs font-medium text-gray-500">Mã vận đơn</p>
                    <p className="font-mono text-lg font-semibold text-gray-900 dark:text-white">{s.trackingNo ?? '—'}</p>
                    {s.createdAt && (
                        <p className="mt-1 text-xs text-gray-500">Tạo: {formatDateTime(s.createdAt)}</p>
                    )}
                </div>
                {s.status && (
                    <Badge variant="info" className="text-sm">
                        {viStatus(s.status)}
                    </Badge>
                )}
            </div>

            {/* Đơn hàng */}
            {o && (
                <section>
                    <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-200">
                        <Package size={16} className="text-indigo-600" />
                        Đơn hàng liên kết
                    </h3>
                    <div className="grid gap-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50 sm:grid-cols-2">
                        <div>
                            <p className="text-xs text-gray-500">Mã đơn</p>
                            <p className="font-medium text-gray-900 dark:text-white">{o.orderNumber ?? '—'}</p>
                            {o.status && (
                                <Badge variant="secondary" className="mt-1">
                                    {viStatus(o.status)}
                                </Badge>
                            )}
                        </div>
                        <div className="sm:text-right" />
                        <div className="sm:col-span-2 space-y-2">
                            <div className="flex gap-2">
                                <MapPin size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                                <div>
                                    <p className="text-xs text-gray-500">Lấy hàng</p>
                                    <p className="text-sm text-gray-800 dark:text-gray-200">{o.pickupAddress || '—'}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <MapPin size={16} className="mt-0.5 shrink-0 text-blue-600" />
                                <div>
                                    <p className="text-xs text-gray-500">Giao hàng</p>
                                    <p className="text-sm text-gray-800 dark:text-gray-200">{o.deliveryAddress || '—'}</p>
                                </div>
                            </div>
                            {(o.pickupPhone || o.deliveryPhone) && (
                                <p className="text-xs text-gray-500">
                                    {o.pickupPhone && <>Người gửi: {o.pickupPhone} </>}
                                    {o.deliveryPhone && <>· Người nhận: {o.deliveryPhone}</>}
                                </p>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* Lô hàng */}
            {(s.weight != null || s.itemCount != null || s.description) && (
                <section>
                    <h3 className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-200">Thông tin lô</h3>
                    <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400">
                        {s.weight != null && <span>Khối lượng: {s.weight} kg</span>}
                        {s.itemCount != null && <span>Số kiện: {s.itemCount}</span>}
                        {s.volume != null && <span>Thể tích: {s.volume} m³</span>}
                    </div>
                    {s.description && <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{s.description}</p>}
                </section>
            )}

            {/* Chặng & điểm dừng */}
            {legs.length > 0 && (
                <section>
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-200">
                        <Route size={16} className="text-amber-600" />
                        Hành trình & phân công
                    </h3>
                    <div className="space-y-6">
                        {legs.map((leg, idx) => {
                            const stops = [...(leg.stops ?? [])].sort(
                                (a, b) => (a.sequence ?? 0) - (b.sequence ?? 0),
                            );
                            const assigns = leg.assignments ?? [];
                            return (
                                <div
                                    key={leg.id || idx}
                                    className="rounded-lg border border-gray-200 dark:border-gray-600 p-3"
                                >
                                    <div className="mb-3 flex flex-wrap items-center gap-2">
                                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                            Chặng {leg.sequence ?? idx + 1}
                                        </span>
                                        {leg.status && (
                                            <Badge variant="warning" className="text-xs">
                                                {viStatus(leg.status)}
                                            </Badge>
                                        )}
                                        {leg.route?.name && (
                                            <span className="text-xs text-gray-500">
                                                · {leg.route.name}
                                                {leg.route.status && ` (${viStatus(leg.route.status)})`}
                                            </span>
                                        )}
                                    </div>
                                    <div className="space-y-3 pl-1">{stops.map((stop) => (
                                        <StopRow
                                            key={stop.id || `${leg.id}-${stop.sequence}`}
                                            stop={stop}
                                            label={stop.type === 'pickup' ? 'Điểm lấy' : stop.type === 'delivery' ? 'Điểm giao' : stop.type || 'Điểm'}
                                        />
                                    ))}</div>

                                    <div className="mt-4 border-t border-gray-100 pt-3 dark:border-gray-800">
                                        <p className="mb-2 text-xs font-medium uppercase text-gray-500">Xe & tài xế</p>
                                        {assigns.length === 0 ? (
                                            <p className="text-sm text-amber-700 dark:text-amber-400">
                                                Chưa có phân công xe — đơn vẫn có thể ở hàng đợi điều phối.
                                            </p>
                                        ) : (
                                            <ul className="space-y-2">
                                                {assigns.map((as) => (
                                                    <li
                                                        key={as.id}
                                                        className="flex flex-wrap items-center gap-3 rounded-md bg-gray-50 px-3 py-2 dark:bg-gray-800/60"
                                                    >
                                                        <Truck size={16} className="text-gray-500" />
                                                        <span className="font-mono text-sm font-medium">
                                                            {as.vehicle?.plate ?? '—'}
                                                        </span>
                                                        {as.vehicle?.type && (
                                                            <span className="text-xs text-gray-500">{as.vehicle.type}</span>
                                                        )}
                                                        {as.driver?.name && (
                                                            <>
                                                                <User size={16} className="ml-2 text-gray-500" />
                                                                <span className="text-sm">{as.driver.name}</span>
                                                                {as.driver.phone && (
                                                                    <span className="text-xs text-gray-500">{as.driver.phone}</span>
                                                                )}
                                                            </>
                                                        )}
                                                        {as.status && (
                                                            <Badge variant="info" className="ml-auto text-xs">
                                                                {viStatus(as.status)}
                                                            </Badge>
                                                        )}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* JSON kỹ thuật — ẩn mặc định */}
            <details className="group rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
                <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                    <ChevronDown
                        size={14}
                        className="transition-transform group-open:rotate-180"
                    />
                    Dữ liệu gốc (JSON) — dành cho tích hợp / gỡ lỗi
                </summary>
                <pre className="max-h-48 overflow-auto border-t border-gray-100 p-3 text-[10px] leading-relaxed dark:border-gray-800">
                    {JSON.stringify(s, null, 2)}
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
    const [selected, setSelected] = useState<ShipmentDetail | null>(null);

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
            if ('shipment' in data && data.shipment) setSelected(data.shipment as ShipmentDetail);
            if ('shipments' in data && data.shipments?.length === 1) {
                setSelected(data.shipments[0] as ShipmentDetail);
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

    const renderShipmentCard = (s: ShipmentDetail, compact?: boolean) => {
        const o = s.order;
        return (
            <div
                key={String(s.trackingNo)}
                className={`rounded-lg border border-gray-200 dark:border-gray-600 p-3 space-y-1 ${compact ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800' : ''}`}
                onClick={compact ? () => setSelected(s) : undefined}
                role={compact ? 'button' : undefined}
            >
                <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-semibold text-gray-900 dark:text-white">{s.trackingNo}</span>
                    {s.status && <Badge variant="info">{viStatus(String(s.status))}</Badge>}
                </div>
                {o?.orderNumber && (
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        Đơn: {o.orderNumber}
                        {o?.status != null && o.status !== '' && (
                            <span className="ml-2 text-xs text-gray-500">({viStatus(String(o.status))})</span>
                        )}
                    </p>
                )}
                {o?.deliveryAddress && (
                    <p className="text-xs text-gray-500 line-clamp-2">Giao: {o.deliveryAddress}</p>
                )}
                {(o?.deliveryPhone || o?.pickupPhone) && (
                    <p className="text-xs text-gray-500">
                        {o?.deliveryPhone && <>NH: {o.deliveryPhone} </>}
                        {o?.pickupPhone && <>· NG: {o.pickupPhone}</>}
                    </p>
                )}
            </div>
        );
    };

    const detail = selected;

    return (
        <Card>
            <CardHeader>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                    <Package size={20} className="text-indigo-600" />
                    {title}
                </h2>
                <p className="text-sm text-gray-500 mt-1">{description}</p>
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

                {result && 'multiple' in result && result.multiple && result.shipments?.length ? (
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Tìm thấy {result.shipments.length} vận đơn ({matchLabel[result.matchType] || result.matchType}) — chọn một
                            đơn:
                        </p>
                        <div className="grid gap-2 max-h-56 overflow-y-auto">
                            {result.shipments.map((s) => renderShipmentCard(s as ShipmentDetail, true))}
                        </div>
                    </div>
                ) : null}

                {detail && (
                    <div className="space-y-3">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Kết quả tra cứu</p>
                        <ShipmentDetailPanel s={detail} />
                    </div>
                )}
            </CardBody>
        </Card>
    );
}
