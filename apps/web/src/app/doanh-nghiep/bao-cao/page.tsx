'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, ChevronRight, Flame } from 'lucide-react';
import { api, routeApi, telemetryApi, vehicleApi } from '@/api';
import MapView from '@/components/shared/map';
import { DataCard } from '@/components/studio/page-ui';
import { PageHead, StudioShell, orgNav } from '@/components/studio/shell';
import { useCurrentCarrier } from '@/hooks/use-current-carrier';
import {
    type IssueRow,
    issueTypeLabel,
    relativeTimeVi,
} from '@/app/co-quan/issue-labels';
import type { Telemetry, Vehicle } from '@/types';

type LiveRoute = {
    id: number;
    status?: string;
    geometry?: string | { type?: string; coordinates?: [number, number][] } | null;
    vehicle?: { id?: number; plate?: string };
};

function parseLine(geometry: LiveRoute['geometry']): GeoJSON.LineString | null {
    if (!geometry) return null;
    try {
        const g = typeof geometry === 'string' ? JSON.parse(geometry) : geometry;
        if (g?.type === 'LineString' && Array.isArray(g.coordinates) && g.coordinates.length >= 2) {
            return g as GeoJSON.LineString;
        }
    } catch {
        /* ignore */
    }
    return null;
}

export default function EnterpriseTrafficMonitorPage() {
    const { carrier } = useCurrentCarrier();
    const [issues, setIssues] = useState<IssueRow[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [positions, setPositions] = useState<Record<number, Telemetry>>({});
    const [routes, setRoutes] = useState<LiveRoute[]>([]);
    const [focus, setFocus] = useState<IssueRow | null>(null);

    const loadIssues = () => {
        api.get('/bottlenecks').then((r) => {
            const items = Array.isArray(r.data?.items) ? r.data.items : [];
            setIssues(items);
        }).catch(() => setIssues([]));
    };

    const loadFleet = useCallback(async () => {
        if (!carrier) return;
        const res = await vehicleApi.getAll({ carrierId: carrier.id, limit: 80 }).catch(() => null);
        const list: Vehicle[] = res ? (res.data.data ?? res.data) : [];
        setVehicles(list);
        const latest = await Promise.all(
            list.map((v) =>
                telemetryApi.getLatest(v.id).then((t) => [v.id, t.data as Telemetry] as const).catch(() => null),
            ),
        );
        const next: Record<number, Telemetry> = {};
        for (const row of latest) {
            if (row?.[1]?.latitude != null && row[1].longitude != null) next[row[0]] = row[1];
        }
        setPositions(next);
        const live = await routeApi.getAll({ carrierId: carrier.id, status: 'in_progress', limit: 20 }).catch(() => null);
        const routeRows: LiveRoute[] = live ? (live.data.data ?? live.data ?? []) : [];
        setRoutes(Array.isArray(routeRows) ? routeRows : []);
    }, [carrier]);

    useEffect(() => {
        loadIssues();
    }, []);

    useEffect(() => {
        loadFleet();
        const id = setInterval(() => { loadIssues(); loadFleet(); }, 15000);
        return () => clearInterval(id);
    }, [loadFleet]);

    const today = new Date().toISOString().slice(0, 10);
    const jam = issues.filter((i) => i.issueType === 'congestion' || i.issueType === 'long_jam');
    const severe = issues.filter((i) => i.issueType === 'accident' || i.issueType === 'long_jam' || i.issueType === 'flood');
    const todayCount = issues.filter((i) => i.createdAt?.slice(0, 10) === today).length;

    const activeLine = useMemo(() => {
        for (const r of routes) {
            const line = parseLine(r.geometry);
            if (line) return line;
        }
        return null;
    }, [routes]);

    const markers = [
        ...Object.entries(positions).map(([id, t]) => {
            const v = vehicles.find((x) => x.id === Number(id));
            return {
                id: `v-${id}`,
                coordinates: [t.longitude, t.latitude] as [number, number],
                type: 'vehicle' as const,
                label: v?.plate || `Xe ${id}`,
                popup: `${v?.plate || 'Xe'} · ${Math.round(t.speed ?? 0)} km/h · đang chạy trên tuyến`,
            };
        }),
        ...(focus && focus.longitude != null && focus.latitude != null
            ? [{
                id: `i-${focus.id}`,
                coordinates: [focus.longitude, focus.latitude] as [number, number],
                type: 'destination' as const,
                label: issueTypeLabel(focus.issueType),
                popup: focus.note || issueTypeLabel(focus.issueType),
            }]
            : []),
    ];

    const center: [number, number] = focus?.longitude != null && focus?.latitude != null
        ? [focus.longitude, focus.latitude]
        : markers[0]?.coordinates ?? [105.8542, 21.0285];

    const feed = issues.slice(0, 8);

    return (
        <StudioShell group="DOANH NGHIỆP" role="Quản trị DN" items={orgNav}>
            <PageHead
                title="Báo cáo giao thông"
                eyebrow="TRUNG TÂM ĐIỀU HÀNH"
                extra={<span className="cq-live"><i /> Dữ liệu trực tiếp</span>}
            />

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
                {[
                    { title: 'Sự cố đang mở', value: issues.length, note: `${severe.length} báo cáo mức nghiêm trọng`, icon: <AlertTriangle size={18} />, tone: 'pink' },
                    { title: 'Điểm ùn tắc', value: jam.length, note: `${Object.keys(positions).length} xe đang định vị trên tuyến`, icon: <Flame size={18} />, tone: 'orange' },
                    { title: 'Đã xác minh hôm nay', value: todayCount, note: 'Báo cáo cộng đồng đã duyệt', icon: <CheckCircle2 size={18} />, tone: 'green' },
                ].map((card) => (
                    <article className="cq-kpi" key={card.title}>
                        <span className={`metric-icon ${card.tone}`}>{card.icon}</span>
                        <div>
                            <p className="text-[12px] font-extrabold tracking-wide text-[#8490a5]">{card.title.toUpperCase()}</p>
                            <p className="mt-0.5 text-[28px] font-extrabold tracking-tight text-[#11213e]">{card.value}</p>
                            <p className="mt-1 text-[11px] text-[#8a97a9]">{card.note}</p>
                        </div>
                    </article>
                ))}
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
                <DataCard
                    title="Tình hình giao thông"
                    subtitle="THEO THỜI GIAN THỰC"
                    toolbar={<span className="cq-live"><i /> Đang cập nhật</span>}
                >
                    <div className="dn-map px-4 pb-4">
                        <MapView
                            className="h-full w-full rounded-[12px]"
                            center={center}
                            zoom={focus ? 15 : 13}
                            showZonesAndRestrictions
                            showApprovedIncidents
                            markers={markers}
                            staticRouteGeometry={activeLine}
                        />
                    </div>
                    <p className="px-5 pb-4 text-[12px] text-[#748298]">
                        Điểm đỏ: báo cáo đã duyệt. Marker xe: GPS đội xe của bạn. Đường xanh: tuyến đang chạy (nếu có hình học).
                    </p>
                </DataCard>

                <DataCard title="Báo cáo sự cố" subtitle="MỚI NHẤT">
                    <ul>
                        {feed.map((item, index) => (
                            <li key={item.id}>
                                <button
                                    type="button"
                                    className={`flex w-full items-center gap-3 border-t border-[#edf0f5] px-5 py-3.5 text-left hover:bg-[#f7f9fc] ${focus?.id === item.id ? 'bg-[#f4f7fb]' : ''}`}
                                    onClick={() => setFocus(item)}
                                >
                                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#feecef] text-[12px] font-bold text-[#c2415c]">{index + 1}</span>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold text-[#152542]">{item.note || issueTypeLabel(item.issueType)}</p>
                                        <p className="text-[11px] text-[#8490a5]">{relativeTimeVi(item.createdAt)} · Đã xác minh</p>
                                    </div>
                                    <ChevronRight size={16} className="text-[#c5ced9]" />
                                </button>
                            </li>
                        ))}
                        {!feed.length && <p className="px-5 py-6 text-sm text-[#8490a5]">Chưa có báo cáo đã duyệt trên bản đồ.</p>}
                    </ul>
                </DataCard>
            </div>
        </StudioShell>
    );
}
