'use client';

import { FormEvent, useMemo, useState } from 'react';
import { Check, MapPin, Package, Phone, Search, Truck } from 'lucide-react';
import { trackingApi } from '@/api';
import Map from '@/components/shared/map';
import { DataCard } from '@/components/studio/page-ui';
import { PageHead, StudioShell, memberNav } from '@/components/studio/shell';
import { viStatus } from '@/lib/status-labels';

type TrackingStop = {
    sequence?: number;
    type?: string;
    address?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    status?: string;
    route?: {
        vehicle?: { plate?: string; type?: string };
        shipper?: { name?: string; phone?: string };
    };
};

type OrderDetail = {
    trackingNo?: string;
    orderNumber?: string;
    status?: string;
    pickupAddress?: string | null;
    deliveryAddress?: string | null;
    pickupLat?: number | null;
    pickupLon?: number | null;
    deliveryLat?: number | null;
    deliveryLon?: number | null;
    pickupPhone?: string | null;
    deliveryPhone?: string | null;
    weightKg?: number | null;
    createdAt?: string;
    updatedAt?: string;
    stops?: TrackingStop[];
};

const STEPS = [
    { id: 'pending', label: 'Đã lấy hàng' },
    { id: 'assigned', label: 'Đã đến trạm' },
    { id: 'in_transit', label: 'Đang giao' },
    { id: 'delivered', label: 'Đã giao' },
];

function stepIndex(status?: string) {
    if (status === 'delivered') return 3;
    if (status === 'in_transit') return 2;
    if (status === 'assigned') return 1;
    if (status === 'pending') return 0;
    return 0;
}

export default function MemberTrackingPage() {
    const [query, setQuery] = useState('');
    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const search = async (e?: FormEvent) => {
        e?.preventDefault();
        const q = query.trim();
        if (!q) { setMessage('Nhập mã vận đơn.'); return; }
        setLoading(true);
        setMessage('');
        try {
            const res = await trackingApi.search(q);
            const data = res.data as { order?: OrderDetail; orders?: OrderDetail[] };
            const found = data.order ?? data.orders?.[0] ?? null;
            if (!found) {
                setOrder(null);
                setMessage('Không tìm thấy mã vận đơn.');
            } else {
                setOrder(found);
            }
        } catch {
            setOrder(null);
            setMessage('Không tìm thấy mã vận đơn.');
        } finally {
            setLoading(false);
        }
    };

    const pickupStop = order?.stops?.find((s) => s.type === 'pickup');
    const dropStop = order?.stops?.find((s) => s.type === 'delivery');
    const shipper = pickupStop?.route?.shipper ?? dropStop?.route?.shipper;
    const plate = pickupStop?.route?.vehicle?.plate ?? dropStop?.route?.vehicle?.plate;
    const active = stepIndex(order?.status);

    const pickup: [number, number] | null =
        pickupStop?.longitude != null && pickupStop?.latitude != null
            ? [pickupStop.longitude, pickupStop.latitude]
            : order?.pickupLon != null && order?.pickupLat != null
                ? [order.pickupLon, order.pickupLat]
                : null;
    const drop: [number, number] | null =
        dropStop?.longitude != null && dropStop?.latitude != null
            ? [dropStop.longitude, dropStop.latitude]
            : order?.deliveryLon != null && order?.deliveryLat != null
                ? [order.deliveryLon, order.deliveryLat]
                : null;

    const markers = useMemo(() => {
        const list: Array<{ id: string; coordinates: [number, number]; type: 'warehouse' | 'destination'; label: string; popup?: string }> = [];
        if (pickup) list.push({ id: 'pickup', coordinates: pickup, type: 'warehouse', label: 'Lấy hàng', popup: order?.pickupAddress || pickupStop?.address || '' });
        if (drop) list.push({ id: 'drop', coordinates: drop, type: 'destination', label: 'Giao hàng', popup: order?.deliveryAddress || dropStop?.address || '' });
        return list;
    }, [pickup, drop, order, pickupStop, dropStop]);

    const route = pickup && drop ? { start: pickup, end: drop } : undefined;
    const center = drop ?? pickup ?? ([105.8542, 21.0285] as [number, number]);

    return (
        <StudioShell group="ĐIỀU HÀNH" role="Thành viên" items={memberNav}>
            <PageHead
                title="Theo dõi đơn hàng"
                eyebrow={null}
                description="Kiểm tra hành trình và vị trí tải xe theo thời gian thực."
                extra={<span className="cq-live"><i /> Dữ liệu trực tiếp</span>}
            />

            <form className="flex flex-col gap-3 rounded-[16px] border border-[#e6ebf2] bg-white p-4 sm:flex-row sm:items-center" onSubmit={search}>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[#152542]">Tra cứu hành trình</p>
                    <p className="text-[12px] text-[#748298]">Nhập mã vận đơn để xem vị trí đơn hàng của bạn</p>
                </div>
                <div className="flex flex-1 gap-2">
                    <div className="flex h-11 flex-1 items-center gap-2 rounded-[11px] border border-[#dce3ed] px-3">
                        <Package size={16} className="text-[#8490a5]" />
                        <input className="w-full text-sm outline-none" placeholder="Mã vận đơn" value={query} onChange={(e) => setQuery(e.target.value)} />
                    </div>
                    <button className="inline-flex h-11 items-center gap-2 rounded-[11px] bg-[#2f6bff] px-4 text-sm font-semibold text-white" type="submit" disabled={loading}>
                        <Search size={16} /> {loading ? 'Đang tìm…' : 'Tra cứu'}
                    </button>
                </div>
            </form>
            {message && <p className="mt-2 text-sm text-[#c2415c]">{message}</p>}

            {order && (
                <div className="mt-4 rounded-[16px] border border-[#e6ebf2] bg-white px-5 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <span className="cq-pill green">{viStatus(order.status)}</span>
                            <p className="mt-2 text-[12px] text-[#8490a5]">MÃ VẬN ĐƠN</p>
                            <p className="font-mono text-lg font-bold text-[#152542]">{order.trackingNo || order.orderNumber}</p>
                        </div>
                        {plate && (
                            <div className="text-right text-sm">
                                <p className="text-[12px] text-[#8490a5]">XE</p>
                                <p className="font-semibold text-[#2f6bff]">{plate}</p>
                            </div>
                        )}
                    </div>
                    <div className="mt-5 grid grid-cols-4 gap-2">
                        {STEPS.map((step, i) => (
                            <div key={step.id} className="text-center">
                                <div className="flex items-center">
                                    {i > 0 && <div className={`h-0.5 flex-1 ${i <= active ? 'bg-[#2f6bff]' : 'bg-[#e4e8f1]'}`} />}
                                    <span className={`grid size-7 place-items-center rounded-full ${i <= active ? 'bg-[#2f6bff] text-white' : 'bg-[#e4e8f1] text-[#8490a5]'}`}>
                                        {i < active ? <Check size={14} /> : i === 2 ? <Truck size={14} /> : i + 1}
                                    </span>
                                    {i < 3 && <div className={`h-0.5 flex-1 ${i < active ? 'bg-[#2f6bff]' : 'bg-[#e4e8f1]'}`} />}
                                </div>
                                <p className="mt-2 text-[11px] font-semibold text-[#33425c]">{step.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
                <DataCard
                    title="Vị trí tải xe"
                    subtitle={order ? 'Đang theo dõi hành trình' : 'Tra cứu mã để hiện bản đồ'}
                >
                    <div className="dn-map px-4 pb-4">
                        <Map
                            className="h-full w-full rounded-[12px]"
                            center={center}
                            zoom={13}
                            showZonesAndRestrictions
                            showApprovedIncidents
                            markers={markers}
                            route={route}
                        />
                    </div>
                </DataCard>

                <DataCard title="Chi tiết hành trình" subtitle={order ? `Trạng thái: ${viStatus(order.status)}` : 'Chưa chọn đơn'}>
                    {order ? (
                        <div className="space-y-4 px-5 pb-5">
                            {shipper && (
                                <div className="flex items-center justify-between rounded-[12px] bg-[#f4f7fb] px-3 py-3">
                                    <div>
                                        <p className="text-sm font-semibold text-[#152542]">{shipper.name}</p>
                                        {plate && <p className="text-[11px] text-[#8490a5]">{plate}</p>}
                                    </div>
                                    {shipper.phone && (
                                        <a href={`tel:${shipper.phone}`} className="grid size-9 place-items-center rounded-full bg-white text-[#2f6bff]">
                                            <Phone size={16} />
                                        </a>
                                    )}
                                </div>
                            )}
                            <div className="relative space-y-4 pl-2">
                                <div className="flex gap-3">
                                    <MapPin size={16} className="mt-0.5 text-[#2f6bff]" />
                                    <div>
                                        <p className="text-[11px] font-extrabold tracking-wide text-[#8490a5]">ĐIỂM LẤY HÀNG</p>
                                        <p className="text-sm font-semibold text-[#152542]">{order.pickupAddress || pickupStop?.address || '—'}</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <MapPin size={16} className="mt-0.5 text-[#152542]" />
                                    <div>
                                        <p className="text-[11px] font-extrabold tracking-wide text-[#8490a5]">ĐIỂM GIAO HÀNG</p>
                                        <p className="text-sm font-semibold text-[#152542]">{order.deliveryAddress || dropStop?.address || '—'}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-between text-sm text-[#33425c]">
                                <span>Khối lượng</span>
                                <span className="font-semibold">{order.weightKg != null ? `${order.weightKg} kg` : '—'}</span>
                            </div>
                            {(order.deliveryPhone || order.pickupPhone) && (
                                <a href={`tel:${order.deliveryPhone || order.pickupPhone}`} className="flex h-11 items-center justify-center gap-2 rounded-[11px] border border-[#dce3ed] text-sm font-semibold text-[#152542]">
                                    <Phone size={16} /> Liên hệ hỗ trợ
                                </a>
                            )}
                        </div>
                    ) : (
                        <p className="px-5 pb-5 text-sm text-[#8490a5]">Nhập mã vận đơn để xem lộ trình, điểm lấy/giao và vị trí trên bản đồ.</p>
                    )}
                </DataCard>
            </div>
        </StudioShell>
    );
}
