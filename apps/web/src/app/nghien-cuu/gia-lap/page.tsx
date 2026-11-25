'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Map, { type GeoJsonFeatureCollection } from '@/components/shared/map';
import { simulationApi } from '@/api';
import { PageHead, StudioShell, adminNavGroups, orgNav, regulatorNav, researchNav } from '@/components/studio/shell';
import { DataTable, getErrorMessage, useToast, type Column } from '@/components/ui';

type Scenario = {
    id: number;
    name: string;
    seed: number;
    orderCount: number;
    lezMode: string;
    status: string;
    kpis?: { totalKm?: number; durationMin?: number; co2G?: number; orders?: number } | null;
};

type OrderRow = {
    id: number;
    organizationName?: string;
    pickupHub?: { name?: string } | null;
    destHub?: { name?: string } | null;
    wardName?: string | null;
    weightKg: number;
    volumeM3: number;
    cargoType: string;
    createdAtSim: string;
};

export default function SimOrdersPage() {
    const pathname = usePathname();
    const { showToast } = useToast();
    const [scenarios, setScenarios] = useState<Scenario[]>([]);
    const [sid, setSid] = useState<number | null>(null);
    const [orders, setOrders] = useState<OrderRow[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [busy, setBusy] = useState(false);
    const [routingId, setRoutingId] = useState<number | null>(null);
    const [routeGeom, setRouteGeom] = useState<GeoJSON.LineString | null>(null);
    const [legGeo, setLegGeo] = useState<GeoJsonFeatureCollection | null>(null);
    const [story, setStory] = useState<string[]>([]);
    const [markers, setMarkers] = useState<Array<{ id: string; coordinates: [number, number]; type?: 'hub' | 'destination'; label?: string; popup?: string }>>([]);
    const [stops, setStops] = useState<Array<{ id: string | number; coordinates: [number, number]; sequence: number; type?: 'pickup' | 'delivery'; label?: string }>>([]);

    const load = useCallback(async () => {
        const res = await simulationApi.scenarios();
        const list = (res.data as Scenario[]) || [];
        setScenarios(list);
        if (!sid && list[0]) setSid(list[0].id);
    }, [sid]);

    useEffect(() => { load().catch(() => undefined); }, [load]);

    useEffect(() => {
        if (!sid) return;
        simulationApi.orders(sid, { page, limit: 10 }).then((res) => {
            setOrders(res.data.data || []);
            setTotal(res.data.meta?.total || 0);
        }).catch(() => undefined);
    }, [sid, page]);

    const current = scenarios.find((s) => s.id === sid);

    const run = async () => {
        if (!sid) return;
        setBusy(true);
        try {
            await simulationApi.generate(sid, false);
            showToast('Đã sinh 1.000 đơn và lộ trình 3 chặng', 'success');
            await load();
            setPage(1);
        } catch (e) {
            showToast(getErrorMessage(e, 'Không sinh được đơn'));
        } finally {
            setBusy(false);
        }
    };

    const create = async (lezMode: string) => {
        setBusy(true);
        try {
            const res = await simulationApi.createScenario({
                name: lezMode === 'none' ? 'Không LEZ · 1.000 đơn' : `LEZ ${lezMode} · 1.000 đơn`,
                seed: 20251125,
                orderCount: 1000,
                lezMode,
            });
            const id = (res.data as Scenario).id;
            setSid(id);
            await simulationApi.generate(id, false);
            if (pathname.startsWith('/co-quan') || pathname.startsWith('/logistics')) {
                await simulationApi.publish(id);
            }
            showToast('Đã tạo và chạy kịch bản', 'success');
            await load();
        } catch (e) {
            showToast(getErrorMessage(e, 'Không tạo được kịch bản'));
        } finally {
            setBusy(false);
        }
    };

    const paintTrip = (payload: {
        order?: { destLat: number; destLon: number; wardName?: string | null; pickupHub?: { name?: string }; destHub?: { name?: string }; organizationName?: string; weightKg?: number };
        legs?: Array<{
            legNo: number;
            vehicleType?: string | null;
            distanceKm?: number;
            durationMin?: number;
            routeGeom?: string;
            fromHub?: { name?: string; longitude: number; latitude: number } | null;
            toHub?: { name?: string; longitude: number; latitude: number } | null;
        }>;
    }) => {
        const colors = ['#2563eb', '#ea580c', '#0e6e5c'];
        const labels = ['MiniHub nhận → Hub tổng', 'Hub tổng → MiniHub giao', 'MiniHub giao → phường nhận'];
        const legs = payload.legs || [];
        const features: GeoJsonFeatureCollection['features'] = [];
        const coords: [number, number][] = [];
        const ms: typeof markers = [];
        const st: typeof stops = [];
        const lines: string[] = [];
        const o = payload.order;
        if (o?.organizationName) lines.push(`${o.organizationName} · ${o.weightKg ?? '—'} kg · không hiện thông tin khách hàng`);
        legs.forEach((leg, i) => {
            let g: GeoJSON.LineString | null = null;
            try { g = JSON.parse(leg.routeGeom || 'null'); } catch { g = null; }
            if (g?.coordinates?.length) {
                coords.push(...(g.coordinates as [number, number][]));
                features.push({
                    type: 'Feature',
                    geometry: { type: 'LineString', coordinates: g.coordinates },
                    properties: { color: colors[i] || '#2563eb', label: labels[i] },
                });
            }
            const from = leg.fromHub;
            const to = leg.toHub;
            if (from && !ms.some((m) => m.id === `h-${from.name}`)) {
                ms.push({ id: `h-${from.name}`, coordinates: [from.longitude, from.latitude], type: 'hub', label: from.name, popup: from.name });
                st.push({ id: `s-${from.name}`, coordinates: [from.longitude, from.latitude], sequence: st.length + 1, type: i === 0 ? 'pickup' : 'delivery', label: from.name });
            }
            if (to && !ms.some((m) => m.id === `h-${to.name}`)) {
                ms.push({ id: `h-${to.name}`, coordinates: [to.longitude, to.latitude], type: 'hub', label: to.name, popup: to.name });
                st.push({ id: `s-${to.name}`, coordinates: [to.longitude, to.latitude], sequence: st.length + 1, type: 'delivery', label: to.name });
            }
            lines.push(
                `Chặng ${leg.legNo}: ${labels[i] || ''} · ${from?.name || '—'} → ${to?.name || o?.wardName || 'phường nhận'} · ${leg.vehicleType || 'xe'} · ${leg.distanceKm ?? 0} km · ${leg.durationMin ?? 0} phút`,
            );
        });
        if (o) {
            ms.push({ id: 'dest', coordinates: [o.destLon, o.destLat], type: 'destination', label: o.wardName || 'Giao cấp phường' });
            st.push({ id: 'dest', coordinates: [o.destLon, o.destLat], sequence: st.length + 1, type: 'delivery', label: o.wardName || 'Giao cấp phường' });
        }
        setMarkers(ms);
        setStops(st);
        setRouteGeom(null);
        setLegGeo({ type: 'FeatureCollection', features });
        setStory(lines);
    };

    const openOrder = async (id: number) => {
        setRoutingId(id);
        try {
            const res = await simulationApi.liveRoute(id);
            paintTrip(res.data);
            showToast('Lộ trình đã chỉ đường theo mạng lưới (không chim bay)', 'success');
        } catch (e) {
            showToast(getErrorMessage(e, 'Không chỉ đường được đơn này'));
        } finally {
            setRoutingId(null);
        }
    };

    const showDemo = async () => {
        setBusy(true);
        try {
            const res = await simulationApi.demoTrip();
            paintTrip(res.data);
            if (res.data.order?.scenarioId) setSid(res.data.order.scenarioId);
            showToast('Đơn mẫu: MiniHub Cầu Giấy → Hub tổng Mê Linh → MiniHub Thanh Xuân', 'success');
        } catch (e) {
            showToast(getErrorMessage(e, 'Không tạo được đơn mẫu'));
        } finally {
            setBusy(false);
        }
    };

    useEffect(() => {
        showDemo().catch(() => undefined);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const columns: Column<OrderRow>[] = [
        { key: 'id', header: 'Đơn' },
        { key: 'organizationName', header: 'Doanh nghiệp' },
        { key: 'pickupHub', header: 'MiniHub nhận', render: (r) => r.pickupHub?.name || '—' },
        { key: 'destHub', header: 'MiniHub giao', render: (r) => r.destHub?.name || '—' },
        { key: 'wardName', header: 'Phường giao' },
        { key: 'cargoType', header: 'Hàng' },
        { key: 'weightKg', header: 'kg' },
        { key: 'volumeM3', header: 'm³' },
        {
            key: 'actions',
            header: 'Thao tác',
            className: 'text-right',
            render: (r) => (
                    <button type="button" disabled={routingId === r.id} className="h-8 rounded-lg border border-[#dce3ed] bg-white px-2.5 text-xs font-semibold text-[#2f6bff] disabled:opacity-50" onClick={() => openOrder(r.id)}>{routingId === r.id ? 'Đang chỉ đường…' : 'Xem lộ trình'}</button>
            ),
        },
    ];

    const body = (
        <div className="space-y-4">
            <PageHead
                title="Giả lập đơn hàng ảo"
                description="1.000 đơn/ngày (8h–17h), chia 3 doanh nghiệp, đi MiniHub nhận → Hub tổng → MiniHub giao. Không lưu thông tin khách hàng."
                    extra={
                    <div className="flex flex-wrap gap-2">
                        <button type="button" className="admin-primary" disabled={busy} onClick={showDemo}>Xem đơn 3 chặng</button>
                        <button type="button" className="rounded-[10px] border bg-white px-3 py-2 text-sm" disabled={busy} onClick={() => create('none')}>Sinh ngày mới</button>
                        <button type="button" className="rounded-[10px] border bg-white px-3 py-2 text-sm" disabled={busy} onClick={run}>Chạy lại seed {current?.seed}</button>
                    </div>
                }
            />
            <div className="grid gap-3 md:grid-cols-4">
                {(['none', 'A', 'B'] as const).map((mode) => (
                    <button key={mode} type="button" className="rounded-2xl bg-white p-4 text-left text-sm" onClick={() => create(mode)}>
                        <p className="text-xs text-[#7b8781]">{mode === 'none' ? 'Đối chứng' : `Kịch bản ${mode}`}</p>
                        <p className="mt-1 font-semibold">{mode === 'none' ? 'Không LEZ' : mode === 'A' ? 'LEZ 2027 Hoàn Kiếm' : 'LEZ Vành đai 1'}</p>
                    </button>
                ))}
                <div className="rounded-2xl bg-white p-4 text-sm">
                    <p className="text-xs text-[#7b8781]">KPI kịch bản đang chọn</p>
                    <p className="mt-1 font-semibold">{Math.round(current?.kpis?.totalKm || 0)} km · {Math.round((current?.kpis?.co2G || 0) / 1000)} kg CO₂e</p>
                    <p className="text-xs text-[#7b8781]">{current?.kpis?.orders || 0} đơn · nguồn giả lập</p>
                </div>
            </div>
            <div className="flex flex-wrap gap-2">
                {scenarios.map((s) => (
                    <button key={s.id} type="button" onClick={() => { setSid(s.id); setPage(1); }} className={`rounded-full px-3 py-1 text-sm ${sid === s.id ? 'bg-[#0b1b3a] text-white' : 'bg-white'}`}>
                        #{s.id} {s.name} · {s.status}
                    </button>
                ))}
            </div>
            {story.length > 0 && (
                <div className="rounded-2xl bg-white p-4 text-sm">
                    <p className="font-semibold">Lộ trình đơn mẫu</p>
                    <ul className="mt-2 space-y-1 text-[#33425c]">
                        {story.map((line) => <li key={line}>{line}</li>)}
                    </ul>
                    <p className="mt-2 text-xs text-[#7b8781]">Xanh dương: gom về hub tổng · Cam: chia về MiniHub giao · Xanh lá: chặng cuối cấp phường</p>
                </div>
            )}
            <div className="h-[520px] overflow-hidden rounded-2xl bg-white">
                <Map
                    className="h-full w-full"
                    center={[105.84, 21.08]}
                    zoom={10.6}
                    markers={markers}
                    stops={stops}
                    staticRouteGeometry={routeGeom}
                    congestionGeoJson={legGeo}
                    showZonesAndRestrictions
                />
            </div>
            <div className="rounded-2xl bg-white p-3">
                <DataTable
                    data={orders}
                    columns={columns}
                    emptyMessage="Chưa có đơn — bấm Sinh ngày mới"
                    pagination={{
                        page,
                        onPageChange: setPage,
                        total,
                        pageSize: 10,
                        totalPages: Math.max(1, Math.ceil(total / 10)),
                    }}
                />
            </div>
        </div>
    );

    if (pathname.startsWith('/logistics')) return <StudioShell group="TRUNG TÂM ĐIỀU HÀNH" role="Quản trị" groups={adminNavGroups}>{body}</StudioShell>;
    if (pathname.startsWith('/co-quan')) return <StudioShell group="CƠ QUAN QUẢN LÝ" role="Cơ quan quản lý" items={regulatorNav}>{body}</StudioShell>;
    if (pathname.startsWith('/doanh-nghiep')) return <StudioShell group="DOANH NGHIỆP" role="Doanh nghiệp" items={orgNav}>{body}</StudioShell>;
    return <StudioShell group="NGHIÊN CỨU" role="Nghiên cứu" items={researchNav}>{body}</StudioShell>;
}
