'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { PageHead, StudioShell, orgNav } from '@/components/studio/shell';
import Map from '@/components/shared/map';
import { simulationApi } from '@/api';
import { DataTable, getErrorMessage, useToast, type Column } from '@/components/ui';
import { useAuthStore } from '@/stores/auth-store';
import type { GeoJsonFeatureCollection } from '@/components/shared/map';

type Hub = {
    id: number;
    name: string;
    hubTier: string;
    organizationId: number;
    organizationName?: string;
    zoneName?: string;
    latitude: number;
    longitude: number;
    capacityKg: number;
    capacityM3: number;
    usedKg: number;
    usedM3: number;
    freeKg: number;
    freeM3: number;
    dataSource?: string;
};

export default function HubCapacityPage() {
    const { showToast } = useToast();
    const orgId = useAuthStore((s) => s.user?.memberships?.[0]?.organization?.id);
    const [hubs, setHubs] = useState<Hub[]>([]);
    const [links, setLinks] = useState<GeoJsonFeatureCollection | null>(null);
    const [needKg, setNeedKg] = useState('200');
    const [needM3, setNeedM3] = useState('1');
    const [edit, setEdit] = useState<{ id: number; usedKg: string; usedM3: string } | null>(null);

    const load = async () => {
        const res = await simulationApi.hubs();
        setHubs(res.data.hubs || []);
        setLinks(res.data.links || null);
    };

    useEffect(() => { load().catch(() => undefined); }, []);

    const filtered = useMemo(() => {
        const kg = Number(needKg) || 0;
        const m3 = Number(needM3) || 0;
        return hubs.filter((h) => h.freeKg >= kg && h.freeM3 >= m3);
    }, [hubs, needKg, needM3]);

    const save = async (e: FormEvent) => {
        e.preventDefault();
        if (!edit) return;
        try {
            await simulationApi.updateCapacity(edit.id, { usedKg: Number(edit.usedKg), usedM3: Number(edit.usedM3) });
            showToast('Đã cập nhật sức chứa kho', 'success');
            setEdit(null);
            await load();
        } catch (err) {
            showToast(getErrorMessage(err, 'Không lưu được'));
        }
    };

    const markers = hubs.map((h) => ({
        id: h.id,
        coordinates: [h.longitude, h.latitude] as [number, number],
        type: 'hub' as const,
        label: `${h.hubTier} · ${h.name}`,
    }));

    const columns: Column<Hub>[] = [
        { key: 'name', header: 'Hub' },
        { key: 'hubTier', header: 'Cấp' },
        { key: 'organizationName', header: 'Doanh nghiệp' },
        { key: 'zoneName', header: 'Phường / khu' },
        { key: 'freeKg', header: 'Còn trống (kg)', render: (h) => `${Math.round(h.freeKg)} / ${Math.round(h.capacityKg)}` },
        { key: 'freeM3', header: 'Còn trống (m³)', render: (h) => `${h.freeM3.toFixed(1)} / ${h.capacityM3}` },
        { key: 'dataSource', header: 'Nguồn' },
        {
            key: 'actions',
            header: 'Thao tác',
            render: (h) => h.organizationId === orgId ? (
                <button type="button" className="h-8 rounded-lg border px-2.5 text-xs font-semibold text-[#0e6e5c]" onClick={() => setEdit({ id: h.id, usedKg: String(h.usedKg), usedM3: String(h.usedM3) })}>Cập nhật</button>
            ) : <span className="text-xs text-[#7b8781]">Chỉ xem</span>,
        },
    ];

    return (
        <StudioShell group="DOANH NGHIỆP" role="Doanh nghiệp" items={orgNav}>
            <div className="space-y-4">
                <PageHead title="Hub & năng lực kho" description="MiniHub nhận/giao và Hub tổng theo từng doanh nghiệp. Công khai kg/m³ còn trống; ẩn thông tin khách hàng." />
                <div className="flex flex-wrap gap-3 rounded-2xl bg-white p-3 text-sm">
                    <label>Cần gửi (kg)<input className="ml-2 rounded border px-2 py-1" value={needKg} onChange={(e) => setNeedKg(e.target.value)} /></label>
                    <label>Cần gửi (m³)<input className="ml-2 rounded border px-2 py-1" value={needM3} onChange={(e) => setNeedM3(e.target.value)} /></label>
                    <span className="self-center text-[#7b8781]">{filtered.length} hub còn chỗ</span>
                </div>
                <div className="h-[420px] overflow-hidden rounded-2xl bg-white">
                    <Map className="h-full w-full" center={[105.84, 21.05]} zoom={10.4} markers={markers} congestionGeoJson={links} />
                </div>
                {edit && (
                    <form className="rounded-2xl bg-white p-4 text-sm" onSubmit={save}>
                        <p className="font-semibold">Khai sức chứa đang dùng</p>
                        <div className="mt-2 flex gap-2">
                            <input className="rounded border px-2 py-1" value={edit.usedKg} onChange={(e) => setEdit({ ...edit, usedKg: e.target.value })} />
                            <input className="rounded border px-2 py-1" value={edit.usedM3} onChange={(e) => setEdit({ ...edit, usedM3: e.target.value })} />
                            <button className="admin-primary" type="submit">Lưu</button>
                        </div>
                    </form>
                )}
                <div className="rounded-2xl bg-white p-3">
                    <DataTable data={filtered} columns={columns} emptyMessage="Không có hub đủ chỗ" />
                </div>
            </div>
        </StudioShell>
    );
}
