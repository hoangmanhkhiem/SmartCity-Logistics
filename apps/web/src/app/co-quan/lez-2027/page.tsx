'use client';

import { useEffect, useMemo, useState } from 'react';
import { PageHead, StudioShell, regulatorNav } from '@/components/studio/shell';
import Map from '@/components/shared/map';
import { simulationApi } from '@/api';

type Hub = {
    id: number;
    name: string;
    hubTier: string;
    latitude: number;
    longitude: number;
};

type Scenario = { id: number; name: string; lezMode: string; kpis?: { totalKm?: number; co2G?: number; orders?: number } | null };

export default function Lez2027Page() {
    const [hubs, setHubs] = useState<Hub[]>([]);
    const [scenarios, setScenarios] = useState<Scenario[]>([]);

    useEffect(() => {
        simulationApi.hubs().then((res) => setHubs((res.data.hubs || []).filter((h: Hub) => h.hubTier === 'TRANSFER'))).catch(() => undefined);
        simulationApi.scenarios().then((res) => setScenarios(res.data || [])).catch(() => undefined);
    }, []);

    const markers = useMemo(() => hubs.map((h) => ({
        id: h.id,
        coordinates: [h.longitude, h.latitude] as [number, number],
        type: 'hub' as const,
        label: h.name,
    })), [hubs]);

    const byMode = (m: string) => scenarios.find((s) => s.lezMode === m);

    return (
        <StudioShell group="CƠ QUAN QUẢN LÝ" role="Cơ quan quản lý" items={regulatorNav}>
            <div className="space-y-4">
                <PageHead
                    title="LEZ 2027 & trạm trung chuyển"
                    description="Hai kịch bản demo: A (Hoàn Kiếm & Cửa Nam, 4 trạm) và B (Vành đai 1, 7 trạm). Ranh gần đúng, sẽ vẽ lại theo QĐ 3273."
                />
                <div className="grid gap-3 md:grid-cols-3">
                    {(['none', 'A', 'B'] as const).map((mode) => {
                        const s = byMode(mode);
                        return (
                            <div key={mode} className="rounded-2xl bg-white p-4 text-sm">
                                <p className="text-xs text-[#7b8781]">{mode === 'none' ? 'Không LEZ' : mode === 'A' ? 'Kịch bản A · 2027' : 'Kịch bản B · Vành đai 1'}</p>
                                <p className="mt-1 text-lg font-semibold">{Math.round(s?.kpis?.totalKm || 0)} km</p>
                                <p>{Math.round((s?.kpis?.co2G || 0) / 1000)} kg CO₂e · {s?.kpis?.orders || 0} đơn</p>
                            </div>
                        );
                    })}
                </div>
                <div className="h-[520px] overflow-hidden rounded-2xl bg-white">
                    <Map className="h-full w-full" center={[105.85, 21.028]} zoom={13} markers={markers} showZonesAndRestrictions />
                </div>
                <p className="text-xs text-[#7b8781]">Tại trạm, xe xăng/dầu dừng; hàng sang xe điện vào vùng. Trạm mang nhãn giả lập (FR29).</p>
            </div>
        </StudioShell>
    );
}
