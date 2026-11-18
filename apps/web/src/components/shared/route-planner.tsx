'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { geocodeApi, routeApi } from '@/api';
import Map from '@/components/shared/map';
import type { GeoJsonFeatureCollection } from '@/components/shared/map';
import { DataCard } from '@/components/studio/page-ui';
import { Button, getErrorMessage } from '@/components/ui';

type Place = { label: string; lat: number; lon: number };
type Compared = { distanceM: number; durationSec: number; hazardScore: number };

function formatMin(sec?: number) {
    if (sec == null || Number.isNaN(sec)) return '—';
    const m = Math.max(1, Math.round(sec / 60));
    if (m < 60) return `${m} phút`;
    const h = Math.floor(m / 60);
    return `${h} giờ ${m % 60} phút`;
}

function AddressField({
    label,
    value,
    committed,
    onChange,
    onPick,
    placeholder,
}: {
    label: string;
    value: string;
    committed?: string;
    onChange: (v: string) => void;
    onPick: (p: Place) => void;
    placeholder: string;
}) {
    const [hints, setHints] = useState<Place[]>([]);
    const [open, setOpen] = useState(false);
    const timer = useRef<number | null>(null);

    useEffect(() => {
        if (timer.current) window.clearTimeout(timer.current);
        const q = value.trim();
        if (q.length < 3 || (committed && q === committed.trim())) {
            setHints([]);
            setOpen(false);
            return;
        }
        timer.current = window.setTimeout(() => {
            geocodeApi.search(q).then((r) => {
                const list = Array.isArray(r.data) ? r.data : [];
                setHints(list);
                setOpen(list.length > 0);
            }).catch(() => { setHints([]); setOpen(false); });
        }, 280);
        return () => { if (timer.current) window.clearTimeout(timer.current); };
    }, [value, committed]);

    const choose = (p: Place) => {
        setHints([]);
        setOpen(false);
        onPick(p);
    };

    return (
        <label className="relative block text-sm font-semibold text-[#33425c]">
            {label}
            <input
                className="mt-1 h-11 w-full rounded-[11px] border border-[#dce3ed] px-3 text-sm font-normal"
                value={value}
                placeholder={placeholder}
                onChange={(e) => { setOpen(true); onChange(e.target.value); }}
                onBlur={() => window.setTimeout(() => setOpen(false), 120)}
                autoComplete="off"
            />
            {open && hints.length > 0 && (
                <ul className="absolute z-20 mt-1 max-h-52 w-full overflow-auto rounded-[12px] border border-[#e6ebf2] bg-white py-1 shadow-lg">
                    {hints.map((h) => (
                        <li key={`${h.lat}-${h.lon}-${h.label}`}>
                            <button
                                type="button"
                                className="w-full px-3 py-2 text-left text-[13px] text-[#152542] hover:bg-[#f4f7fb]"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => choose(h)}
                            >
                                {h.label}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </label>
    );
}

export default function RoutePlanner() {
    const [fromText, setFromText] = useState('');
    const [toText, setToText] = useState('');
    const [from, setFrom] = useState<Place | null>(null);
    const [to, setTo] = useState<Place | null>(null);
    const [pick, setPick] = useState<'from' | 'to'>('from');
    const [vehicle, setVehicle] = useState('');
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState('');
    const [note, setNote] = useState('');
    const [geometry, setGeometry] = useState<GeoJSON.LineString | null>(null);
    const [restrictions, setRestrictions] = useState<GeoJsonFeatureCollection | undefined>(undefined);
    const [duration, setDuration] = useState<number | null>(null);
    const [distance, setDistance] = useState<number | null>(null);
    const [incidentHits, setIncidentHits] = useState(0);
    const [compared, setCompared] = useState<Compared[]>([]);
    const [avoided, setAvoided] = useState(false);

    const plan = async (e?: FormEvent) => {
        e?.preventDefault();
        if (!from || !to) { setMessage('Chọn đủ điểm A và điểm B (gõ địa chỉ hoặc bấm bản đồ).'); return; }
        setBusy(true);
        setMessage('');
        try {
            const res = await routeApi.drivingSegment({
                originLat: from.lat,
                originLon: from.lon,
                destLat: to.lat,
                destLon: to.lon,
                restrictionVehicleType: vehicle || undefined,
                profile: 'driving-traffic',
            });
            const data = res.data as {
                route?: { distance?: number; duration?: number; geometry?: GeoJSON.LineString };
                restrictionsGeoJson?: GeoJsonFeatureCollection;
                routingNote?: string;
                incidentHits?: number;
                compared?: Compared[];
                avoidedProhibited?: boolean;
            };
            const geom = data.route?.geometry ?? null;
            setGeometry(geom);
            setRestrictions(data.restrictionsGeoJson);
            setDuration(data.route?.duration ?? null);
            setDistance(data.route?.distance ?? null);
            setIncidentHits(data.incidentHits ?? 0);
            setCompared(Array.isArray(data.compared) ? data.compared : []);
            setAvoided(Boolean(data.avoidedProhibited));
            setNote(data.routingNote || '');
        } catch (err) {
            setGeometry(null);
            setMessage(getErrorMessage(err, 'Không tìm được tuyến. Kiểm tra Mapbox token hoặc thử địa chỉ khác.'));
        } finally {
            setBusy(false);
        }
    };

    const markers = useMemo(() => {
        const list: Array<{ id: string; coordinates: [number, number]; type: 'warehouse' | 'destination'; label: string; popup?: string }> = [];
        if (from) list.push({ id: 'a', coordinates: [from.lon, from.lat], type: 'warehouse', label: 'A', popup: from.label });
        if (to) list.push({ id: 'b', coordinates: [to.lon, to.lat], type: 'destination', label: 'B', popup: to.label });
        return list;
    }, [from, to]);

    const center: [number, number] = from ? [from.lon, from.lat] : [105.8542, 21.0285];

    return (
        <div className="grid gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
            <form className="space-y-3 rounded-[16px] border border-[#e6ebf2] bg-white p-4" onSubmit={plan}>
                <AddressField
                    label="Điểm A — đi từ"
                    value={fromText}
                    committed={from?.label}
                    placeholder="Ví dụ: 1 Tràng Tiền, Hoàn Kiếm"
                    onChange={(v) => { setFromText(v); setFrom(null); }}
                    onPick={(p) => { setFrom(p); setFromText(p.label); setPick('to'); }}
                />
                <AddressField
                    label="Điểm B — đến"
                    value={toText}
                    committed={to?.label}
                    placeholder="Ví dụ: Đại học GTVT, Cầu Giấy"
                    onChange={(v) => { setToText(v); setTo(null); }}
                    onPick={(p) => { setTo(p); setToText(p.label); }}
                />
                <label className="block text-sm font-semibold text-[#33425c]">
                    Loại xe (lọc đoạn cấm theo loại)
                    <select className="mt-1 h-11 w-full rounded-[11px] border border-[#dce3ed] px-3 text-sm font-normal" value={vehicle} onChange={(e) => setVehicle(e.target.value)}>
                        <option value="">Mọi loại</option>
                        <option value="motorbike">Xe máy</option>
                        <option value="car">Ô tô</option>
                        <option value="van">Xe tải nhỏ</option>
                        <option value="truck">Xe tải</option>
                    </select>
                </label>
                <div className="flex gap-2">
                    <button type="button" className={`h-9 flex-1 rounded-[10px] text-sm font-semibold ${pick === 'from' ? 'bg-[#152542] text-white' : 'bg-[#f4f7fb] text-[#33425c]'}`} onClick={() => setPick('from')}>
                        Bấm bản đồ = A
                    </button>
                    <button type="button" className={`h-9 flex-1 rounded-[10px] text-sm font-semibold ${pick === 'to' ? 'bg-[#152542] text-white' : 'bg-[#f4f7fb] text-[#33425c]'}`} onClick={() => setPick('to')}>
                        Bấm bản đồ = B
                    </button>
                </div>
                <Button type="submit" disabled={busy || !from || !to} className="w-full">
                    {busy ? 'Đang tìm tuyến…' : 'Tìm đường nhanh, né cấm/tắc'}
                </Button>
                {message && <p className="text-sm text-[#c2415c]">{message}</p>}
                {note && !message && <p className="text-[12px] leading-5 text-[#748298]">{note}</p>}
                {(duration != null || distance != null) && (
                    <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-[12px] bg-[#f4f7fb] px-3 py-2">
                            <p className="text-[11px] font-extrabold text-[#8490a5]">THỜI GIAN</p>
                            <p className="text-lg font-extrabold text-[#152542]">{formatMin(duration ?? undefined)}</p>
                        </div>
                        <div className="rounded-[12px] bg-[#f4f7fb] px-3 py-2">
                            <p className="text-[11px] font-extrabold text-[#8490a5]">QUÃNG ĐƯỜNG</p>
                            <p className="text-lg font-extrabold text-[#152542]">{distance != null ? `${(distance / 1000).toFixed(1)} km` : '—'}</p>
                        </div>
                        <div className="rounded-[12px] bg-[#f4f7fb] px-3 py-2">
                            <p className="text-[11px] font-extrabold text-[#8490a5]">ĐIỂM ÙN TẮC GẦN TUYẾN</p>
                            <p className="text-lg font-extrabold text-[#152542]">{incidentHits}</p>
                        </div>
                        <div className="rounded-[12px] bg-[#f4f7fb] px-3 py-2">
                            <p className="text-[11px] font-extrabold text-[#8490a5]">NÉ ĐOẠN CẤM</p>
                            <p className="text-lg font-extrabold text-[#152542]">{avoided ? 'Có vòng né' : 'Ít chồng lấn'}</p>
                        </div>
                    </div>
                )}
                {compared.length > 1 && (
                    <p className="text-[11px] text-[#8490a5]">Đã so {compared.length} phương án Mapbox (ưu tiên ít hazard, rồi thời gian ngắn).</p>
                )}
            </form>

            <DataCard title="Tuyến đề xuất" subtitle="Lớp đỏ = ùn tắc/tai nạn đã duyệt · cam = đoạn cấm/hạn chế">
                <div className="dn-map px-4 pb-4">
                    <Map
                        className="h-full w-full rounded-[12px]"
                        center={center}
                        zoom={from && to ? 12 : 12.5}
                        markers={markers}
                        showZonesAndRestrictions
                        showApprovedIncidents
                        pickLocation
                        pickMarker={pick === 'from' ? (from ? [from.lon, from.lat] : null) : (to ? [to.lon, to.lat] : null)}
                        restrictionsGeoJson={restrictions}
                        staticRouteGeometry={geometry}
                        onMapClick={({ lng, lat }) => {
                            const p: Place = { label: `${lat.toFixed(5)}, ${lng.toFixed(5)}`, lat, lon: lng };
                            if (pick === 'from') { setFrom(p); setFromText(p.label); setPick('to'); }
                            else { setTo(p); setToText(p.label); }
                        }}
                    />
                </div>
            </DataCard>
        </div>
    );
}
