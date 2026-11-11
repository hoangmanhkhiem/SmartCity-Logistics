'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHead, StudioShell, regulatorNav } from '@/components/studio/shell';
import Map from '@/components/shared/map';
import { restrictionApi, roadSegmentApi, zoneApi, api } from '@/api';
import { DataTable, useToast, getErrorMessage, type Column } from '@/components/ui';
import type { Zone } from '@/types';

type DrawMode = 'polygon' | 'line' | 'ward';

const vehicleChoices = [
    { value: 'motorbike_ice', label: 'Xe máy xăng' },
    { value: 'motorbike_ev', label: 'Xe máy điện' },
    { value: 'tricycle', label: 'Ba gác' },
    { value: 'truck', label: 'Xe tải' },
];

type RestrictionRow = {
    id: number;
    description?: string;
    vehicleTypes?: string[];
    timeFrom?: string;
    timeTo?: string;
    severity?: string;
    isActive?: boolean;
    zoneId?: number;
    zone?: { name?: string };
    roadSegment?: { id?: number; name?: string; geometry?: string };
};

function extractPolygons(geo: unknown): GeoJSON.Polygon[] {
    const g = geo as { type?: string; geometry?: GeoJSON.Geometry; features?: unknown[] };
    if (!g) return [];
    if (g.type === 'Polygon') return [g as GeoJSON.Polygon];
    if (g.type === 'Feature' && g.geometry?.type === 'Polygon') return [g.geometry as GeoJSON.Polygon];
    if (g.type === 'FeatureCollection' && Array.isArray(g.features)) {
        return g.features.flatMap((f) => extractPolygons(f));
    }
    return [];
}

export default function ZonePolicyPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const importRef = useRef<HTMLInputElement>(null);
    const [mode, setMode] = useState<DrawMode>('polygon');
    const [zones, setZones] = useState<Zone[]>([]);
    const [rules, setRules] = useState<RestrictionRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [simMsg, setSimMsg] = useState('');

    const [editingRule, setEditingRule] = useState<RestrictionRow | null>(null);
    const [drawnPolygon, setDrawnPolygon] = useState<GeoJSON.Polygon | null>(null);
    const [drawnLine, setDrawnLine] = useState<GeoJSON.LineString | null>(null);
    const [saving, setSaving] = useState(false);
    const [ruleQuery, setRuleQuery] = useState('');
    const [rulePage, setRulePage] = useState(1);
    const [rulePageSize, setRulePageSize] = useState(10);
    const [zonePage, setZonePage] = useState(1);
    const [zonePageSize, setZonePageSize] = useState(10);
    const [form, setForm] = useState({
        name: '',
        zoneId: '',
        timeFrom: '06:00',
        timeTo: '09:00',
        description: '',
        legalRef: '',
        vehicles: ['motorbike_ice'] as string[],
        severity: 'prohibited',
    });

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [zRes, rRes] = await Promise.all([zoneApi.getAll({ limit: 100 }), restrictionApi.getAll()]);
            const zd = zRes.data as { data?: Zone[] };
            setZones(zd.data ?? (Array.isArray(zRes.data) ? zRes.data : []));
            setRules((rRes.data as RestrictionRow[]) || []);
        } catch (error) {
            showToast(getErrorMessage(error, 'Không tải được vùng / quy định. Đăng nhập tài khoản cơ quan quản lý.'));
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => { load(); }, [load]);

    const toggleVehicle = (value: string) => {
        setForm((prev) => ({
            ...prev,
            vehicles: prev.vehicles.includes(value) ? prev.vehicles.filter((v) => v !== value) : [...prev.vehicles, value],
        }));
    };

    const resetForm = () => {
        setEditingRule(null);
        setDrawnLine(null);
        setDrawnPolygon(null);
        setForm({ name: '', zoneId: '', timeFrom: '06:00', timeTo: '09:00', description: '', legalRef: '', vehicles: ['motorbike_ice'], severity: 'prohibited' });
    };

    const selectWard = (zone: { id: number; name: string }) => {
        setMode('ward');
        setForm((prev) => ({ ...prev, zoneId: String(zone.id), name: prev.name || zone.name }));
        showToast(`Đã chọn phường/vùng: ${zone.name}`, 'success');
    };

    const saveRule = async (e: FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const desc = [form.description, form.legalRef && `Căn cứ: ${form.legalRef}`].filter(Boolean).join(' · ');
            let zoneId = form.zoneId ? Number(form.zoneId) : undefined;

            if (editingRule) {
                if (editingRule.roadSegment?.id && (form.name || drawnLine)) {
                    await roadSegmentApi.update(editingRule.roadSegment.id, {
                        name: form.name || undefined,
                        ...(drawnLine && { geometry: JSON.stringify(drawnLine) }),
                    });
                }
                await restrictionApi.update(editingRule.id, {
                    zoneId,
                    timeFrom: form.timeFrom,
                    timeTo: form.timeTo,
                    severity: form.severity,
                    description: desc || undefined,
                    vehicleTypes: form.vehicles,
                    daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                });
                showToast('Đã cập nhật quy định', 'success');
            } else if (mode === 'line') {
                if (!drawnLine) {
                    showToast('Chọn “Chọn đoạn đường” rồi vẽ tuyến trên bản đồ (click nhiều điểm, double-click kết thúc).');
                    setSaving(false);
                    return;
                }
                const roadRes = await roadSegmentApi.create({
                    name: form.name || 'Đoạn hạn chế',
                    zoneId: zoneId,
                    geometry: JSON.stringify(drawnLine),
                });
                await restrictionApi.create({
                    roadSegmentId: (roadRes.data as { id: number }).id,
                    zoneId,
                    timeFrom: form.timeFrom,
                    timeTo: form.timeTo,
                    severity: form.severity,
                    description: desc || undefined,
                    vehicleTypes: form.vehicles,
                    daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    isActive: true,
                });
                showToast('Đã lưu quy định theo đoạn đường', 'success');
            } else if (mode === 'polygon') {
                if (!drawnPolygon) {
                    showToast('Chọn “Vẽ đa giác” rồi vẽ vùng trên bản đồ (click nhiều điểm, double-click khép vùng).');
                    setSaving(false);
                    return;
                }
                const z = await zoneApi.create({
                    name: form.name || 'Vùng hạn chế mới',
                    type: 'lez',
                    description: desc || undefined,
                    boundary: JSON.stringify(drawnPolygon),
                });
                await restrictionApi.create({
                    zoneId: (z.data as { id: number }).id,
                    timeFrom: form.timeFrom,
                    timeTo: form.timeTo,
                    severity: form.severity,
                    description: desc || form.name || 'Quy định vùng vẽ tay',
                    vehicleTypes: form.vehicles,
                    daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    isActive: true,
                });
                showToast('Đã lưu vùng và quy định', 'success');
            } else {
                if (!zoneId) {
                    showToast('Chọn “Chọn theo phường” rồi bấm một phường trên danh sách hoặc trên bản đồ.');
                    setSaving(false);
                    return;
                }
                await restrictionApi.create({
                    zoneId,
                    timeFrom: form.timeFrom,
                    timeTo: form.timeTo,
                    severity: form.severity,
                    description: desc || form.name || 'Quy định theo phường',
                    vehicleTypes: form.vehicles,
                    daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    isActive: true,
                });
                showToast('Đã lưu quy định theo phường', 'success');
            }
            resetForm();
            await load();
        } catch (error) {
            showToast(getErrorMessage(error, 'Không lưu được quy định'));
        } finally {
            setSaving(false);
        }
    };

    const deleteRule = async (row: RestrictionRow) => {
        if (!confirm('Xóa quy định này?')) return;
        try {
            await restrictionApi.delete(row.id);
            showToast('Đã xóa quy định', 'success');
            if (editingRule?.id === row.id) resetForm();
            await load();
        } catch (error) {
            showToast(getErrorMessage(error, 'Không xóa được quy định'));
        }
    };

    const deleteZone = async (zone: Zone) => {
        if (!confirm(`Xóa vùng "${zone.name}"?`)) return;
        try {
            await zoneApi.delete(zone.id);
            showToast('Đã xóa vùng', 'success');
            await load();
        } catch (error) {
            showToast(getErrorMessage(error, 'Không xóa được vùng'));
        }
    };

    const importGeoJson = async (file: File) => {
        try {
            const geo = JSON.parse(await file.text());
            const polygons = extractPolygons(geo);
            if (polygons.length === 0) {
                showToast('File không chứa Polygon');
                return;
            }
            for (let i = 0; i < polygons.length; i++) {
                const name = geo.features?.[i]?.properties?.name || `Vùng nhập ${i + 1}`;
                await zoneApi.create({ name, type: 'lez', boundary: JSON.stringify(polygons[i]) });
            }
            showToast(`Đã nhập ${polygons.length} vùng`, 'success');
            await load();
        } catch (error) {
            showToast(getErrorMessage(error, 'Không nhập được GeoJSON'));
        }
    };

    const simulate = async () => {
        setSimMsg('Đang mô phỏng…');
        try {
            await api.post('/phases/orders/simulate', { count: 20, zoneId: form.zoneId ? Number(form.zoneId) : undefined });
            const r = await api.post('/phases/plans/solve');
            const p = r.data as { orders?: number; totalKm?: number; co2eGrams?: number; warnings?: Array<{ message?: string }> };
            setSimMsg(`Mẫu ${p.orders ?? 0} đơn · ${p.totalKm ?? 0} km · ${p.co2eGrams ?? 0} g CO₂e${p.warnings?.length ? ` · ${p.warnings.length} cảnh báo vùng cấm` : ''}`);
        } catch (error) {
            setSimMsg(getErrorMessage(error, 'Không chạy được mô phỏng. Đăng nhập cơ quan quản lý rồi thử lại.'));
        }
    };

    const hint =
        mode === 'polygon' ? (drawnPolygon ? 'Đã vẽ đa giác — có thể lưu quy định.' : 'Click nhiều điểm trên bản đồ, double-click để khép vùng.')
            : mode === 'line' ? (drawnLine ? `Đã vẽ ${drawnLine.coordinates.length} điểm trên đoạn đường.` : 'Click dọc tuyến phố, double-click để kết thúc đoạn.')
                : form.zoneId ? `Phường đang chọn: ${zones.find((z) => String(z.id) === form.zoneId)?.name || form.zoneId}` : 'Bấm một dòng phường bên dưới, hoặc click vùng trên bản đồ.';

    const startEdit = (r: RestrictionRow) => {
        setEditingRule(r);
        setMode(r.roadSegment?.geometry ? 'line' : 'ward');
        setForm({
            name: r.roadSegment?.name || r.description || '',
            zoneId: r.zoneId ? String(r.zoneId) : '',
            timeFrom: r.timeFrom || '06:00',
            timeTo: r.timeTo || '09:00',
            description: r.description || '',
            legalRef: '',
            vehicles: r.vehicleTypes?.length ? r.vehicleTypes : ['motorbike_ice'],
            severity: r.severity || 'prohibited',
        });
        try { setDrawnLine(r.roadSegment?.geometry ? JSON.parse(r.roadSegment.geometry) : null); } catch { setDrawnLine(null); }
    };

    const filteredRules = rules.filter((r) => {
        const q = ruleQuery.trim().toLowerCase();
        if (!q) return true;
        const hay = [r.description, r.roadSegment?.name, r.zone?.name, (r.vehicleTypes || []).join(' ')].join(' ').toLowerCase();
        return hay.includes(q);
    });
    const rulePages = Math.max(1, Math.ceil(filteredRules.length / rulePageSize) || 1);
    const safeRulePage = Math.min(rulePage, rulePages);
    const pagedRules = filteredRules.slice((safeRulePage - 1) * rulePageSize, safeRulePage * rulePageSize);
    const zonePages = Math.max(1, Math.ceil(zones.length / zonePageSize) || 1);
    const safeZonePage = Math.min(zonePage, zonePages);
    const pagedZones = zones.slice((safeZonePage - 1) * zonePageSize, safeZonePage * zonePageSize);

    const ruleColumns: Column<RestrictionRow>[] = [
        { key: 'description', header: 'Quy định', render: (r) => r.description || r.roadSegment?.name || `#${r.id}` },
        { key: 'zone', header: 'Phạm vi', render: (r) => r.zone?.name || r.roadSegment?.name || '—' },
        { key: 'vehicleTypes', header: 'Loại xe', render: (r) => (r.vehicleTypes || []).join(', ') || 'Mọi loại' },
        { key: 'timeFrom', header: 'Khung giờ', render: (r) => (r.timeFrom && r.timeTo ? `${r.timeFrom}–${r.timeTo}` : 'Cả ngày') },
        { key: 'isActive', header: 'Trạng thái', render: (r) => (r.isActive === false ? 'Tắt' : 'Đang áp dụng') },
        {
            key: 'actions',
            header: '',
            className: 'text-right whitespace-nowrap',
            render: (r) => (
                <>
                    <button type="button" className="text-[#0e6e5c] hover:underline" onClick={() => startEdit(r)}>Sửa</button>
                    {' '}
                    <button type="button" className="text-red-700 hover:underline" onClick={() => deleteRule(r)}>Xóa</button>
                </>
            ),
        },
    ];

    const zoneColumns: Column<Zone>[] = [
        { key: 'name', header: 'Phường / vùng' },
        { key: 'type', header: 'Loại', render: (z) => z.type || '—' },
        {
            key: 'actions',
            header: '',
            className: 'text-right whitespace-nowrap',
            render: (z) => (
                <>
                    <button type="button" className="text-[#0e6e5c] hover:underline" onClick={() => selectWard(z)}>Chọn</button>
                    {' '}
                    <button type="button" className="text-red-700 hover:underline" onClick={() => deleteZone(z)}>Xóa vùng</button>
                </>
            ),
        },
    ];

    return (
        <StudioShell group="CƠ QUAN QUẢN LÝ" role="Cơ quan quản lý" items={regulatorNav}>
            <PageHead
                title="Zone & quy định"
                extra={
                    <>
                        <input ref={importRef} type="file" accept=".json,.geojson" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) importGeoJson(f); e.target.value = ''; }} />
                        <button type="button" className="rounded-lg border bg-white px-3 py-1.5 text-sm" onClick={() => importRef.current?.click()}>Nhập GeoJSON</button>
                        <button type="button" className="rounded-lg bg-[#0e6e5c] px-3 py-1.5 text-sm text-white" onClick={() => { resetForm(); setMode('polygon'); }}>
                            + Quy định mới
                        </button>
                    </>
                }
            />
            <div className="grid gap-4 px-6 pb-6 lg:grid-cols-[1fr_300px]">
                <div className="space-y-3">
                    <div className="flex flex-wrap gap-2 text-sm">
                        {([
                            ['polygon', 'Vẽ đa giác'],
                            ['line', 'Chọn đoạn đường'],
                            ['ward', 'Chọn theo phường'],
                        ] as const).map(([id, label]) => (
                            <button
                                key={id}
                                type="button"
                                onClick={() => setMode(id)}
                                className={`rounded-full px-3 py-1 ${mode === id ? 'bg-[#14352c] text-white' : 'bg-white'}`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                    <p className="rounded-xl bg-[#14352c] px-4 py-2.5 text-sm text-white">{hint}</p>
                    <div className="relative h-[min(72vh,720px)] min-h-[560px] overflow-hidden rounded-2xl bg-white">
                        {mode !== 'ward' && (
                            <div className="pointer-events-none absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-full bg-[#0e6e5c] px-4 py-1.5 text-xs font-semibold text-white shadow">
                                {mode === 'polygon'
                                    ? 'Con trỏ chữ thập: click lần lượt các đỉnh → double-click để khép vùng'
                                    : 'Con trỏ chữ thập: click dọc phố → double-click để kết thúc đoạn'}
                            </div>
                        )}
                        <Map
                            key={mode}
                            className="h-full w-full"
                            center={[105.851, 21.03]}
                            zoom={14.2}
                            showZonesAndRestrictions
                            drawMode={mode === 'ward' ? null : mode}
                            onZoneClick={(z) => selectWard(z)}
                            onDrawComplete={(feature) => {
                                if (feature.geometry.type === 'Polygon') setDrawnPolygon(feature.geometry);
                                if (feature.geometry.type === 'LineString') setDrawnLine(feature.geometry);
                            }}
                            initialDrawFeature={
                                mode === 'polygon' && drawnPolygon
                                    ? { type: 'Feature', properties: {}, geometry: drawnPolygon }
                                    : mode === 'line' && drawnLine
                                        ? { type: 'Feature', properties: {}, geometry: drawnLine }
                                        : null
                            }
                        />
                    </div>
                    <div className="rounded-xl bg-white p-3">
                        <input
                            className="mb-3 w-full rounded border border-slate-200 px-3 py-1.5 text-sm"
                            placeholder="Tìm quy định, phạm vi, loại xe…"
                            value={ruleQuery}
                            onChange={(e) => { setRuleQuery(e.target.value); setRulePage(1); }}
                        />
                        <DataTable
                            columns={ruleColumns}
                            data={pagedRules}
                            loading={loading}
                            emptyMessage={rules.length === 0 ? 'Chưa có quy định' : 'Không khớp tìm kiếm'}
                            pagination={{
                                page: safeRulePage,
                                totalPages: rulePages,
                                onPageChange: setRulePage,
                                total: filteredRules.length,
                                pageSize: rulePageSize,
                                onPageSizeChange: (n) => { setRulePageSize(n); setRulePage(1); },
                            }}
                        />
                    </div>
                    {mode === 'ward' && (
                        <div className="rounded-xl bg-white p-3">
                            <DataTable
                                columns={zoneColumns}
                                data={pagedZones}
                                emptyMessage="Chưa có vùng"
                                pagination={{
                                    page: safeZonePage,
                                    totalPages: zonePages,
                                    onPageChange: setZonePage,
                                    total: zones.length,
                                    pageSize: zonePageSize,
                                    onPageSizeChange: (n) => { setZonePageSize(n); setZonePage(1); },
                                }}
                            />
                        </div>
                    )}
                </div>

                <form className="h-fit space-y-2 rounded-2xl bg-white p-4 text-sm" onSubmit={saveRule}>
                    <h2 className="font-semibold">{editingRule ? 'Sửa quy định' : 'Quy định mới'} · {mode === 'polygon' ? 'vùng đang vẽ' : mode === 'line' ? 'đoạn đường' : 'theo phường'}</h2>
                    <label className="block">Tên<input className="mt-1 w-full rounded border px-2 py-1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={mode === 'line' ? 'Tên tuyến phố' : 'Tên quy định'} /></label>
                    {mode !== 'polygon' && (
                        <label className="block">Phường / vùng
                            <select className="mt-1 w-full rounded border px-2 py-1" value={form.zoneId} onChange={(e) => setForm({ ...form, zoneId: e.target.value })}>
                                <option value="">Chưa chọn</option>
                                {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
                            </select>
                        </label>
                    )}
                    <p className="text-xs text-[#7b8781]">Áp dụng cho</p>
                    {vehicleChoices.map((v) => (
                        <label key={v.value} className="flex gap-2"><input type="checkbox" checked={form.vehicles.includes(v.value)} onChange={() => toggleVehicle(v.value)} /> {v.label}</label>
                    ))}
                    <div className="grid grid-cols-2 gap-2">
                        <label>Từ giờ<input className="mt-1 w-full rounded border px-2 py-1" value={form.timeFrom} onChange={(e) => setForm({ ...form, timeFrom: e.target.value })} /></label>
                        <label>Đến giờ<input className="mt-1 w-full rounded border px-2 py-1" value={form.timeTo} onChange={(e) => setForm({ ...form, timeTo: e.target.value })} /></label>
                    </div>
                    <label className="block">Mức độ
                        <select className="mt-1 w-full rounded border px-2 py-1" value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
                            <option value="prohibited">Cấm</option>
                            <option value="restricted">Hạn chế</option>
                            <option value="allowed_window">Khung được phép</option>
                        </select>
                    </label>
                    <label className="block">Căn cứ pháp lý<input className="mt-1 w-full rounded border px-2 py-1" value={form.legalRef} onChange={(e) => setForm({ ...form, legalRef: e.target.value })} placeholder="số văn bản" /></label>
                    <label className="block">Mô tả<input className="mt-1 w-full rounded border px-2 py-1" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
                    {simMsg && <p className="text-xs text-[#0e6e5c]">{simMsg}</p>}
                    <div className="flex gap-2 pt-2">
                        <button type="button" className="flex-1 rounded-lg border py-2" onClick={simulate}>Mô phỏng tác động</button>
                        <button type="submit" disabled={saving} className="flex-1 rounded-lg bg-[#0e6e5c] py-2 text-white">{saving ? 'Đang lưu…' : 'Lưu quy định'}</button>
                    </div>
                    <button type="button" className="w-full rounded-lg border py-2" onClick={() => router.push('/co-quan/mo-phong')}>Mở trang so sánh A/B</button>
                </form>
            </div>
        </StudioShell>
    );
}
