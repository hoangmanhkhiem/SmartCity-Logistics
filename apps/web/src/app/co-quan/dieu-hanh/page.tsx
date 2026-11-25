'use client';

import { useEffect, useState } from 'react';
import { PageHead, StudioShell, regulatorNav } from '@/components/studio/shell';
import Map from '@/components/shared/map';
import { simulationApi } from '@/api';
import type { GeoJsonFeatureCollection } from '@/components/shared/map';

type Scenario = { id: number; name: string; status: string };

export default function OpsFlowPage() {
    const [scenarios, setScenarios] = useState<Scenario[]>([]);
    const [sid, setSid] = useState<number | null>(null);
    const [hour, setHour] = useState(8);
    const [flow, setFlow] = useState<GeoJsonFeatureCollection | null>(null);
    const [alerts, setAlerts] = useState(0);

    useEffect(() => {
        simulationApi.scenarios().then((res) => {
            const list = (res.data as Scenario[]) || [];
            setScenarios(list);
            if (list[0]) setSid(list[0].id);
        }).catch(() => undefined);
    }, []);

    useEffect(() => {
        if (!sid) return;
        simulationApi.flow(sid, hour).then((res) => {
            const fc = res.data as GeoJsonFeatureCollection;
            setFlow(fc);
            setAlerts((fc.features || []).filter((f) => f.properties?.alert).length);
        }).catch(() => undefined);
    }, [sid, hour]);

    return (
        <StudioShell group="CƠ QUAN QUẢN LÝ" role="Cơ quan quản lý" items={regulatorNav}>
            <div className="space-y-4">
                <PageHead
                    title="Trung tâm điều hành — lưu lượng xe giao hàng"
                    description="Mỗi đoạn đường: số xe giao hàng đi qua theo giờ (đếm từ tuyến giả lập). Kéo thanh 8h–17h. Không mô phỏng pha đèn."
                />
                <div className="flex flex-wrap items-center gap-2">
                    {scenarios.map((s) => (
                        <button key={s.id} type="button" onClick={() => setSid(s.id)} className={`rounded-full px-3 py-1 text-sm ${sid === s.id ? 'bg-[#0b1b3a] text-white' : 'bg-white'}`}>{s.name}</button>
                    ))}
                </div>
                <div className="rounded-2xl bg-white p-4">
                    <div className="flex items-center justify-between text-sm">
                        <span>Giờ trong ngày: <b>{hour}:00</b></span>
                        <span className={alerts ? 'text-[#b91c1c]' : 'text-[#7b8781]'}>{alerts} đoạn vượt ngưỡng</span>
                    </div>
                    <input className="mt-2 w-full" type="range" min={8} max={17} value={hour} onChange={(e) => setHour(Number(e.target.value))} />
                </div>
                <div className="h-[560px] overflow-hidden rounded-2xl bg-white">
                    <Map className="h-full w-full" center={[105.84, 21.03]} zoom={11.6} congestionGeoJson={flow} showZonesAndRestrictions />
                </div>
            </div>
        </StudioShell>
    );
}
