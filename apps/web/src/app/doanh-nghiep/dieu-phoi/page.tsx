'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { routeApi, shipperApi } from '@/api';
import { DataCard, SoftTag } from '@/components/studio/page-ui';
import { PageHead, StudioShell, orgNav } from '@/components/studio/shell';
import { Button, DataTable, getErrorMessage, type Column } from '@/components/ui';
import { useCurrentCarrier } from '@/hooks/use-current-carrier';
import { formatCurrency, formatDate } from '@/lib/utils';
import { viStatus } from '@/lib/status-labels';
import type { Order, Route, ShipperProfile } from '@/types';

export default function DispatchOrdersPage() {
    const { carrier, loading: carrierLoading } = useCurrentCarrier();
    const [orders, setOrders] = useState<Order[]>([]);
    const [routes, setRoutes] = useState<Route[]>([]);
    const [shippers, setShippers] = useState<ShipperProfile[]>([]);
    const [selected, setSelected] = useState<number[]>([]);
    const [shipperId, setShipperId] = useState('');
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState('');

    const load = useCallback(async () => {
        if (!carrier) return;
        setLoading(true);
        try {
            const [orderRes, routeRes, shipperRes] = await Promise.all([
                routeApi.getUnassignedOrders(carrier.id),
                routeApi.getAll({ carrierId: carrier.id, limit: 50 }),
                shipperApi.listByCarrier(carrier.id),
            ]);
            setOrders(Array.isArray(orderRes.data) ? orderRes.data : []);
            setRoutes(routeRes.data.data ?? routeRes.data ?? []);
            setShippers(Array.isArray(shipperRes.data) ? shipperRes.data : []);
            setSelected([]);
            setShipperId('');
        } catch (e) {
            setMessage(getErrorMessage(e, 'Không tải được dữ liệu điều phối.'));
        } finally {
            setLoading(false);
        }
    }, [carrier]);

    useEffect(() => {
        if (carrier) load();
        else if (!carrierLoading) setLoading(false);
    }, [carrier, carrierLoading, load]);

    const toggle = (id: number) => {
        setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
    };

    const allIds = orders.map((o) => o.id);
    const allSelected = allIds.length > 0 && allIds.every((id) => selected.includes(id));

    const selectedOrders = useMemo(() => orders.filter((o) => selected.includes(o.id)), [orders, selected]);
    const zoneId = selectedOrders[0]?.zoneId ?? undefined;
    const chosenShipper = shippers.find((s) => String(s.userId) === shipperId);
    const mappedVehicleId = chosenShipper?.currentVehicle?.id ?? chosenShipper?.currentVehicleId;

    const assign = async (force = false) => {
        if (!carrier || !selected.length || !shipperId || !mappedVehicleId) return;
        setBusy(true);
        setMessage('');
        try {
            await routeApi.createFromOrders({
                carrierId: carrier.id,
                vehicleId: Number(mappedVehicleId),
                shipperId: Number(shipperId),
                zoneId,
                orderIds: selected,
                shiftDate: new Date().toISOString().slice(0, 10),
                force,
            });
            const shipper = chosenShipper;
            setMessage(`Đã gán ${selected.length} đơn cho ${shipper?.user?.name ?? 'shipper'} · xe ${shipper?.currentVehicle?.plate ?? mappedVehicleId}.`);
            await load();
        } catch (e) {
            const data = (e as { response?: { data?: { message?: unknown; violations?: unknown[] } } })?.response?.data;
            if (data?.violations?.length) {
                setMessage('Tuyến có thể vi phạm hạn chế giao thông. Bấm lại “Gán chuyến (bỏ qua cảnh báo)” nếu vẫn muốn tạo.');
            } else {
                setMessage(getErrorMessage(e, 'Không gán được chuyến.'));
            }
        } finally {
            setBusy(false);
        }
    };

    const orderCols: Column<Order>[] = [
        {
            key: 'select',
            header: '',
            className: 'w-10',
            render: (row) => (
                <input type="checkbox" checked={selected.includes(row.id)} onChange={() => toggle(row.id)} aria-label={row.orderNumber} />
            ),
        },
        { key: 'orderNumber', header: 'Mã đơn', render: (r) => <span className="font-mono font-semibold">{r.orderNumber}</span> },
        { key: 'zone', header: 'Khu vực', render: (r) => r.zone?.name ?? '—' },
        { key: 'deliveryAddress', header: 'Điểm giao', render: (r) => r.deliveryAddress || '—' },
        { key: 'codAmount', header: 'COD', render: (r) => (r.codAmount ? formatCurrency(r.codAmount) : '—') },
        { key: 'status', header: 'Trạng thái', render: (r) => <SoftTag tone="orange">{viStatus(r.status)}</SoftTag> },
    ];

    const routeCols: Column<Route>[] = [
        { key: 'code', header: 'Mã chuyến' },
        { key: 'shiftDate', header: 'Ngày', render: (r) => formatDate(r.shiftDate) },
        { key: 'shipper', header: 'Shipper', render: (r) => r.shipper?.name ?? '—' },
        { key: 'vehicle', header: 'Xe', render: (r) => r.vehicle?.plate ?? '—' },
        { key: 'stops', header: 'Điểm', render: (r) => String(r.stops?.length ?? 0) },
        {
            key: 'status',
            header: 'Trạng thái',
            render: (r) => (
                <SoftTag tone={r.status === 'completed' ? 'green' : r.status === 'cancelled' ? 'red' : r.status === 'in_progress' ? 'blue' : 'orange'}>
                    {viStatus(r.status)}
                </SoftTag>
            ),
        },
    ];

    return (
        <StudioShell group="DOANH NGHIỆP" role="Quản trị DN" items={orgNav}>
            <PageHead
                title="Điều phối đơn hàng"
                eyebrow="TRUNG TÂM ĐIỀU HÀNH"
                description="Chọn đơn rồi chọn shipper. Xe gắn với shipper đó được lấy tự động."
                extra={<span className="cq-live"><i /> {carrier?.name || 'Chưa gắn carrier'}</span>}
            />

            {!carrier && !carrierLoading && (
                <p className="text-sm text-[#8490a5]">Tài khoản chưa gắn doanh nghiệp vận tải (carrier). Không điều phối được đơn.</p>
            )}

            {carrier && (
                <>
                    <DataCard
                        title="Đơn chưa gán chuyến"
                        subtitle={`${orders.length} đơn pending của ${carrier.name}`}
                        toolbar={
                            <label className="flex items-center gap-2 text-sm font-semibold text-[#33425c]">
                                <input type="checkbox" checked={allSelected} disabled={!allIds.length} onChange={() => setSelected(allSelected ? [] : allIds)} />
                                Chọn tất cả
                            </label>
                        }
                    >
                        <div className="px-2 pb-2">
                            <DataTable columns={orderCols} data={orders} loading={loading} emptyMessage="Không còn đơn pending. Tạo đơn mới hoặc các đơn đã được gom chuyến." />
                        </div>
                    </DataCard>

                    <div className="mt-4 grid gap-3 rounded-[16px] border border-[#e6ebf2] bg-white p-4 lg:grid-cols-[minmax(0,1fr)_220px_auto] lg:items-end">
                        <label className="block text-sm font-semibold text-[#33425c]">
                            Shipper (xe gắn sẵn)
                            <select className="mt-1 h-11 w-full rounded-[11px] border border-[#dce3ed] px-3 text-sm font-normal" value={shipperId} onChange={(e) => setShipperId(e.target.value)}>
                                <option value="">Chọn shipper</option>
                                {shippers.map((s) => {
                                    const plate = s.currentVehicle?.plate;
                                    const ready = Boolean(s.currentVehicle?.id ?? s.currentVehicleId);
                                    return (
                                        <option key={s.userId} value={s.userId} disabled={!ready}>
                                            {s.user?.name ?? `Shipper #${s.userId}`} · {plate ? `xe ${plate}` : 'chưa gắn xe'}
                                        </option>
                                    );
                                })}
                            </select>
                        </label>
                        <div className="rounded-[11px] border border-[#edf0f5] bg-[#f7f9fc] px-3 py-2">
                            <p className="text-[11px] font-extrabold tracking-wide text-[#8490a5]">XE MAPPING</p>
                            <p className="text-sm font-semibold text-[#152542]">
                                {chosenShipper?.currentVehicle?.plate
                                    ? `${chosenShipper.currentVehicle.plate}${chosenShipper.currentVehicle.type ? ` · ${chosenShipper.currentVehicle.type}` : ''}`
                                    : chosenShipper ? 'Shipper này chưa gắn xe' : 'Chọn shipper để hiện xe'}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button type="button" disabled={busy || !selected.length || !shipperId || !mappedVehicleId} onClick={() => assign(false)}>
                                Gán {selected.length || ''} đơn
                            </Button>
                            <Button type="button" variant="outline" disabled={busy || !selected.length || !shipperId || !mappedVehicleId} onClick={() => assign(true)}>
                                Gán (bỏ qua cảnh báo)
                            </Button>
                        </div>
                    </div>
                    {message && <p className="mt-3 text-sm text-[#152542]">{message}</p>}

                    <div className="mt-4">
                        <DataCard title="Chuyến đã gán" subtitle="Shipper nào đang nhận đơn của đơn vị">
                            <div className="px-2 pb-2">
                                <DataTable columns={routeCols} data={routes} loading={loading} emptyMessage="Chưa có chuyến nào." />
                            </div>
                        </DataCard>
                    </div>
                </>
            )}
        </StudioShell>
    );
}
