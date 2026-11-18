'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, PlayCircle, XCircle } from 'lucide-react';
import { shipperApi } from '@/api';
import { DataCard, SoftTag } from '@/components/studio/page-ui';
import { PageHead, StudioShell, memberNav } from '@/components/studio/shell';
import { Button, DataTable, getErrorMessage, type Column } from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/utils';
import { viStatus } from '@/lib/status-labels';
import { useAuthStore } from '@/stores/auth-store';
import type { Route, Stop } from '@/types';

const OPEN = new Set(['pending', 'arrived']);
const DONE = new Set(['completed', 'failed', 'skipped']);

const FAIL_REASONS = [
    { value: 'returned', label: 'Hoàn hàng' },
    { value: 'refused', label: 'Khách từ chối nhận' },
    { value: 'customer_absent', label: 'Khách không có mặt' },
    { value: 'address_wrong', label: 'Sai địa chỉ' },
    { value: 'damaged', label: 'Hàng hư hỏng' },
    { value: 'other', label: 'Khác' },
];

type FilterKey = 'all' | 'delivering' | 'done' | 'returned' | 'failed';

type DeliveryRow = Stop & {
    orderNumber?: string;
    route?: {
        id: number;
        code: string;
        status: string;
        shiftDate: string;
        vehicle?: { plate?: string };
    };
};

function deliveryKind(row: DeliveryRow): FilterKey {
    if (row.status === 'completed' || row.order?.status === 'delivered') return 'done';
    if (row.status === 'failed' && (row.failedReason === 'returned' || row.failedReason === 'refused')) return 'returned';
    if (row.status === 'failed' || row.order?.status === 'failed') return 'failed';
    return 'delivering';
}

function deliveryLabel(row: DeliveryRow) {
    const kind = deliveryKind(row);
    if (kind === 'done') return 'Giao thành công';
    if (kind === 'returned') return 'Hoàn hàng';
    if (kind === 'failed') return 'Giao thất bại';
    if (row.status === 'arrived') return 'Đang giao · đã đến';
    if (row.order?.status === 'in_transit' || row.route?.status === 'in_progress') return 'Đang giao';
    return 'Chờ giao';
}

function toneFor(kind: FilterKey): 'orange' | 'blue' | 'green' | 'red' {
    if (kind === 'done') return 'green';
    if (kind === 'returned') return 'orange';
    if (kind === 'failed') return 'red';
    return 'blue';
}

export default function ShipperOrdersPage() {
    const { user } = useAuthStore();
    const isShipper = user?.memberships?.some((m) => m.role?.name === 'shipper');
    const [todayRoute, setTodayRoute] = useState<Route | null>(null);
    const [deliveries, setDeliveries] = useState<DeliveryRow[]>([]);
    const [routeStops, setRouteStops] = useState<Stop[]>([]);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [selected, setSelected] = useState<number[]>([]);
    const [filter, setFilter] = useState<FilterKey>('all');
    const [failReason, setFailReason] = useState('returned');
    const [failNote, setFailNote] = useState('');
    const [showFail, setShowFail] = useState(false);
    const [message, setMessage] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await shipperApi.listMyDeliveries();
            const data = res.data as { todayRoute?: Route | null; deliveries?: DeliveryRow[] };
            const today = data.todayRoute ?? null;
            setTodayRoute(today);
            setDeliveries(Array.isArray(data.deliveries) ? data.deliveries : []);
            setRouteStops(today?.stops ?? []);
            setSelected([]);
        } catch {
            setTodayRoute(null);
            setDeliveries([]);
            setRouteStops([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isShipper) load();
        else setLoading(false);
    }, [isShipper, load]);

    const counts = useMemo(() => ({
        all: deliveries.length,
        delivering: deliveries.filter((d) => deliveryKind(d) === 'delivering').length,
        done: deliveries.filter((d) => deliveryKind(d) === 'done').length,
        returned: deliveries.filter((d) => deliveryKind(d) === 'returned').length,
        failed: deliveries.filter((d) => deliveryKind(d) === 'failed').length,
    }), [deliveries]);

    const rows = useMemo(
        () =>
            deliveries
                .map((s) => ({ ...s, orderNumber: s.order?.orderNumber || s.order?.trackingNo || `#${s.orderId}` }))
                .filter((s) => filter === 'all' || deliveryKind(s) === filter),
        [deliveries, filter],
    );
    const openIds = rows.filter((r) => OPEN.has(r.status)).map((r) => r.id);
    const allOpenSelected = openIds.length > 0 && openIds.every((id) => selected.includes(id));

    const toggle = (id: number, status: string) => {
        if (!OPEN.has(status)) return;
        setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
    };

    const apiError = (e: unknown) => {
        if (e instanceof Error && !('response' in e)) return e.message;
        return getErrorMessage(e, 'Không xử lý được. Thử lại.');
    };

    const processSelected = async (mode: 'success' | 'fail') => {
        if (!selected.length) return;
        if (mode === 'fail' && !failReason) return;
        setBusy(true);
        setMessage('');
        try {
            const chosen = deliveries
                .filter((r) => selected.includes(r.id) && OPEN.has(r.status))
                .sort((a, b) => {
                    if ((a.route?.id ?? 0) !== (b.route?.id ?? 0)) return (a.route?.id ?? 0) - (b.route?.id ?? 0);
                    return a.sequence - b.sequence;
                });

            const stopsByRoute = new Map<number, Stop[]>();
            if (todayRoute?.id) stopsByRoute.set(todayRoute.id, (todayRoute.stops ?? routeStops).map((s) => ({ ...s })));

            for (const stop of chosen) {
                const routeId = stop.routeId || stop.route?.id;
                if (!routeId) throw new Error('Thiếu chuyến của đơn.');
                if (!stopsByRoute.has(routeId)) {
                    const detail = await shipperApi.getRoute(routeId);
                    stopsByRoute.set(routeId, (detail.data?.stops ?? []).map((s: Stop) => ({ ...s })));
                    if (detail.data?.status === 'planned') await shipperApi.startRoute(routeId);
                } else if (routeId === todayRoute?.id && todayRoute.status === 'planned') {
                    await shipperApi.startRoute(routeId);
                }

                const working = stopsByRoute.get(routeId) ?? [];
                const mark = (id: number, status: Stop['status']) => {
                    const found = working.find((s) => s.id === id);
                    if (found) found.status = status;
                };
                const priors = working.filter((s) => s.sequence < stop.sequence && !DONE.has(s.status));
                for (const prior of priors) {
                    if (prior.type === 'pickup' && prior.orderId === stop.orderId) {
                        if (prior.status === 'pending') await shipperApi.arriveStop(prior.id);
                        await shipperApi.completeStop(prior.id, {});
                        mark(prior.id, 'completed');
                        continue;
                    }
                    throw new Error(`Cần xử lý điểm dừng #${prior.sequence} trước đơn ${stop.order?.orderNumber ?? stop.orderId}.`);
                }
                const current = working.find((s) => s.id === stop.id);
                if (mode === 'success') {
                    if (current?.status === 'pending') await shipperApi.arriveStop(stop.id);
                    await shipperApi.completeStop(stop.id, {
                        codAmountCollected: stop.codAmountDue ?? undefined,
                    });
                    mark(stop.id, 'completed');
                } else {
                    await shipperApi.failStop(stop.id, { failedReason: failReason, note: failNote || undefined });
                    mark(stop.id, 'failed');
                }
            }
            setMessage(
                mode === 'success'
                    ? `Đã xác nhận giao thành công ${chosen.length} đơn.`
                    : `Đã ghi nhận ${chosen.length} đơn.`,
            );
            if (mode === 'fail') {
                setShowFail(false);
                setFailNote('');
            }
            await load();
        } catch (e) {
            setMessage(apiError(e));
        } finally {
            setBusy(false);
        }
    };

    const columns: Column<DeliveryRow>[] = [
        {
            key: 'select',
            header: '',
            className: 'w-10',
            render: (row) => (
                <input
                    type="checkbox"
                    checked={selected.includes(row.id)}
                    disabled={!OPEN.has(row.status)}
                    onChange={() => toggle(row.id, row.status)}
                    aria-label={`Chọn ${row.orderNumber}`}
                />
            ),
        },
        {
            key: 'shiftDate',
            header: 'Ngày',
            render: (row) => (row.route?.shiftDate ? formatDate(row.route.shiftDate) : '—'),
        },
        { key: 'orderNumber', header: 'Mã đơn', render: (row) => <span className="font-mono font-semibold">{row.orderNumber}</span> },
        { key: 'route', header: 'Chuyến', render: (row) => row.route?.code || '—' },
        { key: 'address', header: 'Điểm giao', render: (row) => row.address || row.order?.deliveryAddress || '—' },
        { key: 'contact', header: 'Liên hệ', render: (row) => row.contactPhone || row.order?.deliveryPhone || '—' },
        {
            key: 'cod',
            header: 'COD',
            render: (row) => (row.codAmountDue ? formatCurrency(row.codAmountDue) : '—'),
        },
        {
            key: 'status',
            header: 'Trạng thái',
            render: (row) => <SoftTag tone={toneFor(deliveryKind(row))}>{deliveryLabel(row)}</SoftTag>,
        },
    ];

    const filters: Array<{ id: FilterKey; label: string }> = [
        { id: 'all', label: `Tất cả (${counts.all})` },
        { id: 'delivering', label: `Đang giao (${counts.delivering})` },
        { id: 'done', label: `Giao thành công (${counts.done})` },
        { id: 'returned', label: `Hoàn hàng (${counts.returned})` },
        { id: 'failed', label: `Thất bại (${counts.failed})` },
    ];

    if (!isShipper) {
        return (
            <StudioShell group="ĐIỀU HÀNH" role="Thành viên" items={memberNav}>
                <PageHead title="Đơn đang giao" eyebrow={null} description="Trang này chỉ dành cho tài khoản shipper." />
                <p className="text-sm text-[#8490a5]">Đăng nhập bằng tài khoản shipper để xem danh sách đơn cần giao.</p>
            </StudioShell>
        );
    }

    return (
        <StudioShell group="ĐIỀU HÀNH" role="Shipper" items={memberNav}>
            <PageHead
                title="Đơn đang giao"
                eyebrow={null}
                description="Đơn hôm nay và các chuyến trước: đang giao, giao thành công, hoàn hàng hoặc thất bại."
                extra={<span className="cq-live"><i /> Lịch sử chuyến</span>}
            />

            <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {[
                    { title: 'Đang giao', value: counts.delivering, tone: 'blue' },
                    { title: 'Giao thành công', value: counts.done, tone: 'green' },
                    { title: 'Hoàn hàng', value: counts.returned, tone: 'orange' },
                    { title: 'Thất bại', value: counts.failed, tone: 'red' },
                ].map((card) => (
                    <article className="cq-kpi" key={card.title}>
                        <div>
                            <p className="text-[12px] font-extrabold tracking-wide text-[#8490a5]">{card.title.toUpperCase()}</p>
                            <p className="mt-0.5 text-[26px] font-extrabold tracking-tight text-[#11213e]">{card.value}</p>
                        </div>
                    </article>
                ))}
            </div>

            {todayRoute && todayRoute.status === 'planned' && (
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-[#e6ebf2] bg-white px-4 py-3">
                    <p className="text-sm text-[#33425c]">
                        Chuyến hôm nay <span className="font-semibold">{todayRoute.code}</span> chưa bắt đầu.
                    </p>
                    <Button
                        type="button"
                        variant="outline"
                        isLoading={busy}
                        onClick={async () => {
                            setBusy(true);
                            try {
                                await shipperApi.startRoute(todayRoute.id);
                                await load();
                            } catch (e) {
                                setMessage(apiError(e));
                            } finally {
                                setBusy(false);
                            }
                        }}
                    >
                        <PlayCircle size={16} className="mr-1.5" /> Bắt đầu chuyến
                    </Button>
                </div>
            )}

            <DataCard
                title="Danh sách đơn"
                subtitle={todayRoute ? `Chuyến hiện tại ${todayRoute.code} · ${viStatus(todayRoute.status)}` : 'Chưa có chuyến mở hôm nay — vẫn xem được đơn các ngày trước'}
                toolbar={
                    <label className="flex items-center gap-2 text-sm font-semibold text-[#33425c]">
                        <input
                            type="checkbox"
                            checked={allOpenSelected}
                            onChange={() => setSelected(allOpenSelected ? [] : openIds)}
                            disabled={!openIds.length}
                        />
                        Chọn đơn còn mở
                    </label>
                }
            >
                <div className="flex flex-wrap gap-2 px-4 pb-3">
                    {filters.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            className={`h-8 rounded-[8px] px-3 text-[12px] font-semibold ${filter === item.id ? 'bg-[#152542] text-white' : 'bg-[#f4f7fb] text-[#33425c]'}`}
                            onClick={() => setFilter(item.id)}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
                <div className="px-2 pb-2">
                    <DataTable
                        columns={columns}
                        data={rows}
                        loading={loading}
                        emptyMessage="Chưa có đơn giao nào được gán cho bạn."
                    />
                </div>
            </DataCard>

            {message && <p className="mt-3 text-sm text-[#152542]">{message}</p>}

            <div className="mt-4 flex flex-wrap gap-2">
                <Button type="button" disabled={busy || !selected.length} onClick={() => processSelected('success')}>
                    <CheckCircle2 size={16} className="mr-1.5" /> Xác nhận giao thành công
                </Button>
                <Button type="button" variant="danger" disabled={busy || !selected.length} onClick={() => setShowFail(true)}>
                    <XCircle size={16} className="mr-1.5" /> Hoàn hàng / thất bại
                </Button>
            </div>

            {showFail && (
                <div className="mt-4 space-y-3 rounded-[14px] border border-[#e6ebf2] bg-white p-4">
                    <p className="text-sm font-semibold text-[#152542]">Lý do</p>
                    <select
                        className="h-11 w-full rounded-[11px] border border-[#dce3ed] px-3 text-sm"
                        value={failReason}
                        onChange={(e) => setFailReason(e.target.value)}
                    >
                        {FAIL_REASONS.map((r) => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                    </select>
                    <input
                        className="h-11 w-full rounded-[11px] border border-[#dce3ed] px-3 text-sm"
                        placeholder="Ghi chú (tuỳ chọn)"
                        value={failNote}
                        onChange={(e) => setFailNote(e.target.value)}
                    />
                    <div className="flex gap-2">
                        <Button type="button" variant="danger" isLoading={busy} disabled={!selected.length} onClick={() => processSelected('fail')}>
                            Xác nhận
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setShowFail(false)}>Huỷ</Button>
                    </div>
                </div>
            )}
        </StudioShell>
    );
}
