'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardBody, CardHeader, Button, Input } from '@/components/ui';
import { restrictionApi, routeApi } from '@/lib/api';
import { MapPin, Navigation } from 'lucide-react';
import { normalizeRestrictionFeatureCollection } from '@/lib/geojson-lnglat';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';
const ROUTE_SOURCE = 'suggest-route';
const ROUTE_LAYER = 'suggest-route-line';

/** Tuyến phụ: điểm đi → hub gần điểm đi */
const SPOKE_SOURCE_O = 'spoke-origin-hub-src';
const SPOKE_LAYER_O = 'spoke-origin-hub-line';
/** Điểm đến → hub gần điểm đến */
const SPOKE_SOURCE_D = 'spoke-dest-hub-src';
const SPOKE_LAYER_D = 'spoke-dest-hub-line';
/** Hai hub gần điểm đi / điểm đến nối với nhau */
const SPOKE_SOURCE_HH = 'spoke-hub-hub-src';
const SPOKE_LAYER_HH = 'spoke-hub-hub-line';

const RESTRICT_SOURCE = 'facility-suggest-restrictions';
const RESTRICT_LAYER = 'facility-suggest-restrictions-line';

/** Thời điểm áp dụng cấm đường + routing: giờ xuất phát nếu người dùng đã chọn, không thì hiện tại. */
function restrictionAtFromDeparture(departureTime: string): string {
    if (departureTime.trim()) {
        const d = new Date(departureTime);
        if (!Number.isNaN(d.getTime())) return d.toISOString();
    }
    return new Date().toISOString();
}

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

function pickNearestFacility<T extends { latitude: number; longitude: number }>(items: T[], lat: number, lng: number): T {
    let best = items[0];
    let bestD = Infinity;
    for (const f of items) {
        const d = haversineMeters(f.latitude, f.longitude, lat, lng);
        if (d < bestD) {
            bestD = d;
            best = f;
        }
    }
    return best;
}

function removeSpokeLayers(map: mapboxgl.Map) {
    for (const layerId of [SPOKE_LAYER_O, SPOKE_LAYER_D, SPOKE_LAYER_HH]) {
        if (map.getLayer(layerId)) map.removeLayer(layerId);
    }
    for (const src of [SPOKE_SOURCE_O, SPOKE_SOURCE_D, SPOKE_SOURCE_HH]) {
        if (map.getSource(src)) map.removeSource(src);
    }
}

async function fetchDrivingSegmentSpoke(
    a: [number, number],
    b: [number, number],
    restrictionAt: string,
): Promise<[number, number][] | null> {
    try {
        const res = await routeApi.drivingSegment({
            originLon: a[0],
            originLat: a[1],
            destLon: b[0],
            destLat: b[1],
            restrictionAt,
        });
        const data = res.data as { route?: { geometry?: { coordinates?: [number, number][] } } };
        const coords = data.route?.geometry?.coordinates;
        return coords?.length ? coords : null;
    } catch {
        return null;
    }
}

type SuggestResponse = {
    route: {
        distance: number;
        duration: number;
        geometry: { coordinates: [number, number][] };
    };
    suggestions: Array<{
        id: string;
        name: string;
        kind: string;
        latitude: number;
        longitude: number;
        address?: string;
        distanceToRouteMeters: number;
    }>;
    /** GeoJSON đoạn cấm khi routing (cùng tham số thời gian) */
    restrictionsGeoJson?: GeoJSON.FeatureCollection;
    routingNote?: string;
};

export default function FacilitySuggestPage() {
    const [origin, setOrigin] = useState('105.84117,21.0245');
    const [destination, setDestination] = useState('105.78,21.0285');
    const [departureTime, setDepartureTime] = useState('');
    const [bufferMeters, setBufferMeters] = useState('1500');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<SuggestResponse | null>(null);
    const [pickMode, setPickMode] = useState<'origin' | 'dest' | null>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    /** Marker kho/hub gợi ý (sau khi chạy API) */
    const suggestionMarkersRef = useRef<mapboxgl.Marker[]>([]);
    /** Marker điểm đi / điểm đến — luôn hiển thị khi tọa độ hợp lệ */
    const originMarkerRef = useRef<mapboxgl.Marker | null>(null);
    const destMarkerRef = useRef<mapboxgl.Marker | null>(null);
    const pickModeRef = useRef<typeof pickMode>(null);
    pickModeRef.current = pickMode;
    /** Hủy vẽ tuyến phụ / tuyến chính khi đổi kết quả hoặc unmount */
    const mapDrawGenRef = useRef(0);

    function parseLngLat(s: string): [number, number] | null {
        const parts = s.split(',').map((x) => Number(String(x).trim()));
        if (parts.length < 2 || parts.some((n) => Number.isNaN(n))) return null;
        return [parts[0], parts[1]];
    }

    /** Khi chọn điểm: tắt kéo bản đồ (dragPan) — nếu không sẽ luôn là cursor bàn tay và không bấm chọn được điểm. */
    const applyPickInteraction = (map: mapboxgl.Map, picking: boolean) => {
        const canvas = map.getCanvas();
        if (picking) {
            map.dragPan.disable();
            map.scrollZoom.disable();
            map.boxZoom.disable();
            map.doubleClickZoom.disable();
            map.dragRotate.disable();
            canvas.style.cursor = 'crosshair';
        } else {
            map.dragPan.enable();
            map.scrollZoom.enable();
            map.boxZoom.enable();
            map.doubleClickZoom.enable();
            map.dragRotate.enable();
            canvas.style.cursor = '';
        }
    };

    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;
        const run = () => applyPickInteraction(map, Boolean(pickMode));
        if (map.isStyleLoaded()) run();
        else map.once('load', run);
    }, [pickMode]);

    useEffect(() => {
        const onKey = (ev: KeyboardEvent) => {
            if (ev.key === 'Escape') setPickMode(null);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current || !MAPBOX_TOKEN) return;
        mapboxgl.accessToken = MAPBOX_TOKEN;
        const map = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: [105.85, 21.03],
            zoom: 11,
        });
        mapRef.current = map;
        map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
        map.on('click', (e) => {
            const mode = pickModeRef.current;
            if (!mode) return;
            const lng = Number(e.lngLat.lng.toFixed(6));
            const lat = Number(e.lngLat.lat.toFixed(6));
            const s = `${lng},${lat}`;
            if (mode === 'origin') setOrigin(s);
            else setDestination(s);
            setPickMode(null);
        });
        map.once('load', () => {
            map.addSource(RESTRICT_SOURCE, {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] },
            });
            map.addLayer({
                id: RESTRICT_LAYER,
                type: 'line',
                source: RESTRICT_SOURCE,
                layout: { 'line-join': 'round', 'line-cap': 'round' },
                paint: {
                    'line-color': ['coalesce', ['get', 'color'], '#ea580c'],
                    'line-width': 4,
                    'line-opacity': 0.82,
                },
            });
            if (pickModeRef.current) applyPickInteraction(map, true);
        });
        return () => {
            originMarkerRef.current?.remove();
            destMarkerRef.current?.remove();
            originMarkerRef.current = null;
            destMarkerRef.current = null;
            map.remove();
            mapRef.current = null;
        };
    }, []);

    /** Đoạn cấm / hạn chế: cùng thời điểm với routing (giờ xuất phát nếu có, không thì hiện tại). */
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;
        let cancelled = false;

        const applyGeo = async () => {
            const atIso = restrictionAtFromDeparture(departureTime);
            const t = new Date(atIso);
            if (Number.isNaN(t.getTime())) return;

            try {
                const res = await restrictionApi.getActiveGeoJson({
                    at: t.toISOString(),
                });
                if (cancelled) return;
                const raw = res.data as GeoJSON.FeatureCollection;
                const norm = normalizeRestrictionFeatureCollection(raw) as GeoJSON.FeatureCollection;
                const trySet = () => {
                    const src = map.getSource(RESTRICT_SOURCE) as mapboxgl.GeoJSONSource | undefined;
                    if (src) {
                        src.setData(norm);
                        return true;
                    }
                    return false;
                };
                if (!trySet()) requestAnimationFrame(() => { if (!cancelled) trySet(); });
            } catch {
                const tryClear = () => {
                    const src = map.getSource(RESTRICT_SOURCE) as mapboxgl.GeoJSONSource | undefined;
                    if (src) src.setData({ type: 'FeatureCollection', features: [] });
                };
                tryClear();
            }
        };

        const start = () => {
            let frames = 0;
            const tick = () => {
                if (map.getSource(RESTRICT_SOURCE)) {
                    void applyGeo();
                    return;
                }
                frames += 1;
                if (frames < 240) requestAnimationFrame(tick);
            };
            if (map.isStyleLoaded()) tick();
            else map.once('load', tick);
        };
        start();
        return () => {
            cancelled = true;
        };
    }, [departureTime]);

    /** Marker đỏ/xanh điểm đi & điểm đến (cập nhật khi nhập tay hoặc chọn trên map) */
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        const sync = () => {
            const o = parseLngLat(origin);
            const d = parseLngLat(destination);

            originMarkerRef.current?.remove();
            destMarkerRef.current?.remove();
            originMarkerRef.current = null;
            destMarkerRef.current = null;

            if (o) {
                originMarkerRef.current = new mapboxgl.Marker({ color: '#2563eb' })
                    .setLngLat(o)
                    .setPopup(new mapboxgl.Popup({ offset: 24 }).setHTML('<strong>Điểm đi</strong>'))
                    .addTo(map);
            }
            if (d) {
                destMarkerRef.current = new mapboxgl.Marker({ color: '#7c3aed' })
                    .setLngLat(d)
                    .setPopup(new mapboxgl.Popup({ offset: 24 }).setHTML('<strong>Điểm đến</strong>'))
                    .addTo(map);
            }
        };

        if (map.isStyleLoaded()) sync();
        else map.once('load', sync);
    }, [origin, destination]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        const gen = ++mapDrawGenRef.current;

        const clearRouteLayers = () => {
            suggestionMarkersRef.current.forEach((m) => m.remove());
            suggestionMarkersRef.current = [];
            removeSpokeLayers(map);
            if (map.getLayer(ROUTE_LAYER)) map.removeLayer(ROUTE_LAYER);
            if (map.getSource(ROUTE_SOURCE)) map.removeSource(ROUTE_SOURCE);
        };

        const draw = () => {
            if (gen !== mapDrawGenRef.current) return;
            clearRouteLayers();

            if (!result?.route?.geometry?.coordinates?.length) return;

            const coords = result.route.geometry.coordinates;

            map.addSource(ROUTE_SOURCE, {
                type: 'geojson',
                data: {
                    type: 'Feature',
                    properties: {},
                    geometry: { type: 'LineString', coordinates: coords },
                },
            });
            map.addLayer({
                id: ROUTE_LAYER,
                type: 'line',
                source: ROUTE_SOURCE,
                paint: {
                    'line-color': '#2563eb',
                    'line-width': 6,
                    'line-opacity': 0.88,
                },
            });

            for (const f of result.suggestions) {
                const el = document.createElement('div');
                el.innerHTML = `<div style="background:#059669;color:white;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:600;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.3)">${f.kind}</div>`;
                const marker = new mapboxgl.Marker(el)
                    .setLngLat([f.longitude, f.latitude])
                    .setPopup(
                        new mapboxgl.Popup().setHTML(
                            `<strong>${f.name}</strong><br/>${f.address || ''}<br/><span style="color:#64748b">${Math.round(f.distanceToRouteMeters)}m từ tuyến</span>`,
                        ),
                    )
                    .addTo(map);
                suggestionMarkersRef.current.push(marker);
            }

            const bounds = new mapboxgl.LngLatBounds();
            coords.forEach((c) => bounds.extend(c as [number, number]));
            result.suggestions.forEach((f) => bounds.extend([f.longitude, f.latitude]));
            map.fitBounds(bounds, { padding: 60, duration: 600 });

            // Tuyến phụ: điểm đi → hub gần điểm đi | điểm đến → hub gần điểm đến | 2 hub ↔ (màu khác)
            void (async () => {
                const oPt = parseLngLat(origin);
                const dPt = parseLngLat(destination);
                if (gen !== mapDrawGenRef.current) return;
                if (!oPt || !dPt || !result.suggestions.length) return;

                const hubNearOrigin = pickNearestFacility(result.suggestions, oPt[1], oPt[0]);
                const hubNearDest = pickNearestFacility(result.suggestions, dPt[1], dPt[0]);

                const hubO: [number, number] = [hubNearOrigin.longitude, hubNearOrigin.latitude];
                const hubD: [number, number] = [hubNearDest.longitude, hubNearDest.latitude];

                const restrictIso = restrictionAtFromDeparture(departureTime);
                const [lineOriginHub, lineDestHub, lineHubHub] = await Promise.all([
                    fetchDrivingSegmentSpoke(oPt, hubO, restrictIso),
                    fetchDrivingSegmentSpoke(dPt, hubD, restrictIso),
                    hubNearOrigin.id !== hubNearDest.id
                        ? fetchDrivingSegmentSpoke(hubO, hubD, restrictIso)
                        : Promise.resolve(null),
                ]);

                const m = mapRef.current;
                if (!m || gen !== mapDrawGenRef.current) return;
                removeSpokeLayers(m);

                const addSpoke = (
                    layerId: string,
                    sourceId: string,
                    line: [number, number][] | null,
                    color: string,
                    width: number,
                    dash?: [number, number],
                ) => {
                    if (!line?.length) return;
                    m.addSource(sourceId, {
                        type: 'geojson',
                        data: {
                            type: 'Feature',
                            properties: {},
                            geometry: { type: 'LineString', coordinates: line },
                        },
                    });
                    m.addLayer({
                        id: layerId,
                        type: 'line',
                        source: sourceId,
                        paint: {
                            'line-color': color,
                            'line-width': width,
                            'line-opacity': 0.92,
                            ...(dash ? { 'line-dasharray': dash } : {}),
                        },
                    });
                };

                addSpoke(SPOKE_LAYER_O, SPOKE_SOURCE_O, lineOriginHub, '#ea580c', 4);
                addSpoke(SPOKE_LAYER_D, SPOKE_SOURCE_D, lineDestHub, '#db2777', 4);
                addSpoke(SPOKE_LAYER_HH, SPOKE_SOURCE_HH, lineHubHub, '#0f766e', 3, [2, 1.5]);

                // Mở rộng view để thấy thêm các tuyến phụ
                try {
                    const b = new mapboxgl.LngLatBounds();
                    coords.forEach((c) => b.extend(c as [number, number]));
                    result.suggestions.forEach((f) => b.extend([f.longitude, f.latitude]));
                    [lineOriginHub, lineDestHub, lineHubHub].forEach((line) => {
                        line?.forEach((c) => b.extend(c as [number, number]));
                    });
                    m.fitBounds(b, { padding: 70, duration: 500, maxZoom: 13 });
                } catch {
                    /* ignore */
                }
            })();
        };

        if (map.isStyleLoaded()) draw();
        else map.once('load', draw);

        return () => {
            mapDrawGenRef.current += 1;
        };
    }, [result, origin, destination, departureTime]);

    async function onSubmit(e: FormEvent) {
        e.preventDefault();
        setError('');
        const [oLon, oLat] = origin.split(',').map(Number);
        const [dLon, dLat] = destination.split(',').map(Number);
        if ([oLon, oLat, dLon, dLat].some((n) => Number.isNaN(n))) {
            setError('Định dạng: lng,lat cho điểm đi và điểm đến.');
            return;
        }
        setLoading(true);
        try {
            const res = await routeApi.suggestFacilities({
                originLat: oLat,
                originLon: oLon,
                destLat: dLat,
                destLon: dLon,
                kinds: ['warehouse', 'hub'],
                bufferMeters: Number(bufferMeters) || 1500,
                limit: 25,
                ...(departureTime ? { departureTime: new Date(departureTime).toISOString() } : {}),
                restrictionAt: restrictionAtFromDeparture(departureTime),
            });
            setResult(res.data as SuggestResponse);
        } catch (err: unknown) {
            const ax = err as { response?: { data?: { message?: string } } };
            setError(ax.response?.data?.message || 'Không gợi ý được — kiểm tra MAPBOX trên server và tọa độ.');
            setResult(null);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="mx-auto max-w-4xl space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gợi ý kho / hub dọc tuyến</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Tuyến chính điểm đi → điểm đến (xanh dương). Sau khi có kho/hub trong buffer: cam = điểm đi → hub gần điểm đi; hồng = điểm đến →
                    hub gần điểm đến; xanh lá đứt = nối hai hub đó (nếu khác nhau). Cơ sở gần mỗi đầu được chọn theo khoảng cách địa lý. Các đoạn cấm/hạn chế
                    đường và cách chọn tuyến dùng <strong>giờ xuất phát</strong> nếu bạn nhập — nếu không nhập giờ thì hệ thống dùng thời điểm hiện tại (bạn không
                    cần biết chi tiết từng đoạn cấm).
                </p>
            </div>

            <Card>
                <CardHeader>
                    <h2 className="text-lg font-semibold">Tham số</h2>
                </CardHeader>
                <CardBody>
                    <form onSubmit={onSubmit} className="space-y-3">
                        <div className="grid gap-3 md:grid-cols-2">
                            <Input label="Điểm đi (lng,lat)" value={origin} onChange={(e) => setOrigin(e.target.value)} />
                            <Input label="Điểm đến (lng,lat)" value={destination} onChange={(e) => setDestination(e.target.value)} />
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                            <Input
                                label="Buffer (mét)"
                                type="number"
                                min={50}
                                value={bufferMeters}
                                onChange={(e) => setBufferMeters(e.target.value)}
                            />
                            <div>
                                <label className="mb-1 block text-sm text-gray-600">
                                    Giờ xuất phát (tuỳ chọn — lọc giờ mở cửa; đồng thời dùng cho cấm đường trên bản đồ & chọn tuyến)
                                </label>
                                <Input type="datetime-local" value={departureTime} onChange={(e) => setDepartureTime(e.target.value)} />
                                <p className="mt-1 text-xs text-gray-500">
                                    Để trống: quy định cấm đường và routing tính theo thời điểm bạn bấm &quot;Gợi ý cơ sở&quot;.
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button type="button" variant={pickMode === 'origin' ? 'primary' : 'outline'} onClick={() => setPickMode('origin')}>
                                <MapPin size={16} className="mr-1" /> Chọn điểm đi
                            </Button>
                            <Button type="button" variant={pickMode === 'dest' ? 'primary' : 'outline'} onClick={() => setPickMode('dest')}>
                                <MapPin size={16} className="mr-1" /> Chọn điểm đến
                            </Button>
                            <Button type="submit" disabled={loading}>
                                <Navigation size={16} className="mr-1" />
                                {loading ? 'Đang tính…' : 'Gợi ý cơ sở'}
                            </Button>
                        </div>
                        {pickMode && (
                            <p className="text-sm text-blue-600">
                                Chế độ chọn điểm: con trỏ dạng <strong>chữ thập</strong> — nhấp một lần để đặt {pickMode === 'origin' ? 'điểm đi' : 'điểm đến'}.
                                Kéo bản đồ đã tạm tắt để không nhầm với chọn điểm. Bấm <kbd className="rounded border border-blue-300 bg-blue-50 px-1">Esc</kbd> để
                                huỷ.
                            </p>
                        )}
                    </form>
                </CardBody>
            </Card>

            {MAPBOX_TOKEN ? (
                <div ref={mapContainerRef} className="h-[380px] w-full overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700" />
            ) : (
                <p className="text-sm text-amber-700">Thiếu NEXT_PUBLIC_MAPBOX_TOKEN — bản đồ không hiển thị.</p>
            )}

            {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}

            {result && (
                <Card>
                    <CardHeader>
                        <h2 className="text-lg font-semibold">Kết quả</h2>
                    </CardHeader>
                    <CardBody className="space-y-2 text-sm">
                        <p>
                            Khoảng cách tuyến: <strong>{(result.route.distance / 1000).toFixed(1)} km</strong> — Thời gian:{' '}
                            <strong>{Math.round(result.route.duration / 60)} phút</strong>
                        </p>
                        {result.routingNote && (
                            <p className="rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
                                {result.routingNote}
                            </p>
                        )}
                        {result.suggestions.length > 0 ? (
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                {(() => {
                                    const oPt = parseLngLat(origin);
                                    const dPt = parseLngLat(destination);
                                    if (!oPt || !dPt) return null;
                                    const hO = pickNearestFacility(result.suggestions, oPt[1], oPt[0]);
                                    const hD = pickNearestFacility(result.suggestions, dPt[1], dPt[0]);
                                    return (
                                        <>
                                            <span className="mr-2 inline-block h-2 w-2 rounded-full bg-orange-500 align-middle" title="Tuyến cam" />{' '}
                                            Hub gần điểm đi: <strong>{hO.name}</strong>
                                            <span className="mx-2">·</span>
                                            <span className="mr-2 inline-block h-2 w-2 rounded-full bg-pink-600 align-middle" title="Tuyến hồng" />{' '}
                                            Hub gần điểm đến: <strong>{hD.name}</strong>
                                            {hO.id !== hD.id ? (
                                                <>
                                                    <span className="mx-2">·</span>
                                                    <span className="mr-2 inline-block h-2 w-2 rounded-full bg-teal-700 align-middle" title="Tuyến giữa hub" />{' '}
                                                    Nối hai hub trên bản đồ
                                                </>
                                            ) : (
                                                <span className="text-gray-500"> (cùng một cơ sở — không vẽ nối giữa hai hub)</span>
                                            )}
                                        </>
                                    );
                                })()}
                            </p>
                        ) : null}
                        <p className="font-medium text-gray-800 dark:text-gray-200">Gợi ý ({result.suggestions.length})</p>
                        <ul className="max-h-64 space-y-2 overflow-y-auto">
                            {result.suggestions.map((f) => (
                                <li key={f.id} className="rounded-lg border border-gray-100 bg-gray-50 p-2 dark:border-gray-700 dark:bg-gray-800/50">
                                    <span className="font-medium">{f.name}</span>{' '}
                                    <span className="text-gray-500">({f.kind})</span>
                                    <span className="float-right text-emerald-700">{Math.round(f.distanceToRouteMeters)} m</span>
                                </li>
                            ))}
                        </ul>
                        {result.suggestions.length === 0 && (
                            <p className="text-gray-500">Không có hub/kho nào trong buffer — thử tăng buffer hoặc đổi tuyến.</p>
                        )}
                    </CardBody>
                </Card>
            )}
        </div>
    );
}
