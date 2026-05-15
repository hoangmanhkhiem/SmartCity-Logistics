'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardBody, CardHeader, Badge, Button, Select, Input, Modal } from '@/components/ui';
import { restrictionApi, roadSegmentApi, zoneApi } from '@/lib/api';
import { Settings, Clock, Truck, MapPin, Plus, RefreshCw } from 'lucide-react';
import type { Zone } from '@/types';
import { normalizeRestrictionFeatureCollection } from '@/lib/geojson-lnglat';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';
const SOURCE_ID = 'restriction-geojson';
const LAYER_ID = 'restriction-lines';

type GeoJsonFC = GeoJSON.FeatureCollection;

function toLocalDatetimeValue(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function LogisticsRestrictionsPage() {
    const [restrictions, setRestrictions] = useState<Record<string, unknown>[]>([]);
    const [zones, setZones] = useState<Zone[]>([]);
    const [loading, setLoading] = useState(true);
    const [mapLoading, setMapLoading] = useState(false);
    const [at, setAt] = useState(() => toLocalDatetimeValue(new Date()));
    const [vehicleType, setVehicleType] = useState('');
    const [geoJson, setGeoJson] = useState<GeoJsonFC | null>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);

    const [modalOpen, setModalOpen] = useState(false);
    const [roadForm, setRoadForm] = useState({
        name: '',
        zoneId: '',
        geometryJson: '{"type":"LineString","coordinates":[[105.85,21.03],[105.852,21.032]]}',
    });
    const [restrictionForm, setRestrictionForm] = useState({
        timeFrom: '07:00',
        timeTo: '09:00',
        daysOfWeek: 'Mon,Tue,Wed,Thu,Fri',
        severity: 'restricted',
        description: '',
        vehicleTypes: 'truck',
    });

    const loadList = useCallback(async () => {
        try {
            const res = await restrictionApi.getAll();
            setRestrictions((res.data as Record<string, unknown>[]) || []);
        } catch {
            setRestrictions([]);
        }
    }, []);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                const [zRes] = await Promise.all([
                    zoneApi.getAll({ limit: 100 }),
                    loadList(),
                ]);
                if (!cancelled) {
                    const zd = zRes.data as { data?: Zone[] };
                    setZones(zd.data ?? []);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [loadList]);

    const fetchGeo = useCallback(async () => {
        const iso = new Date(at);
        if (Number.isNaN(iso.getTime())) return;
        setMapLoading(true);
        try {
            const res = await restrictionApi.getActiveGeoJson({
                at: iso.toISOString(),
                ...(vehicleType ? { vehicleType } : {}),
            });
            const raw = res.data as GeoJsonFC;
            setGeoJson(normalizeRestrictionFeatureCollection(raw) as GeoJsonFC);
        } catch {
            setGeoJson({ type: 'FeatureCollection', features: [] });
        } finally {
            setMapLoading(false);
        }
    }, [at, vehicleType]);

    useEffect(() => {
        fetchGeo();
    }, [fetchGeo]);

    useEffect(() => {
        if (!mapContainerRef.current || !MAPBOX_TOKEN) return;
        mapboxgl.accessToken = MAPBOX_TOKEN;
        const map = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: [105.8542, 21.0285],
            zoom: 11,
        });
        map.addControl(new mapboxgl.NavigationControl(), 'top-right');
        mapRef.current = map;
        map.on('load', () => {
            map.addSource(SOURCE_ID, {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] },
            });
            map.addLayer({
                id: LAYER_ID,
                type: 'line',
                source: SOURCE_ID,
                layout: { 'line-join': 'round', 'line-cap': 'round' },
                paint: {
                    'line-color': ['coalesce', ['get', 'color'], '#ea580c'],
                    'line-width': 5,
                    'line-opacity': 0.85,
                },
            });
        });
        return () => {
            map.remove();
            mapRef.current = null;
        };
    }, []);

    useEffect(() => {
        const map = mapRef.current;
        if (!map || !geoJson) return;
        const apply = () => {
            const src = map.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
            if (src) {
                src.setData(geoJson);
                try {
                    const bounds = new mapboxgl.LngLatBounds();
                    let any = false;
                    for (const f of geoJson.features) {
                        const g = f.geometry;
                        if (g?.type === 'LineString' && Array.isArray(g.coordinates)) {
                            for (const c of g.coordinates as number[][]) {
                                bounds.extend(c as [number, number]);
                                any = true;
                            }
                        }
                    }
                    if (any) map.fitBounds(bounds, { padding: 48, maxZoom: 13, duration: 500 });
                } catch {
                    /* ignore fit */
                }
            }
        };
        if (map.isStyleLoaded()) apply();
        else map.once('load', apply);
    }, [geoJson]);

    const handleCreateChain = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            JSON.parse(roadForm.geometryJson);
        } catch {
            alert('Geometry không phải JSON hợp lệ');
            return;
        }
        const roadRes = await roadSegmentApi.create({
            name: roadForm.name,
            zoneId: roadForm.zoneId || undefined,
            geometry: roadForm.geometryJson,
        });
        const road = roadRes.data as { id: string };
        const days = restrictionForm.daysOfWeek
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
        const vtypes = restrictionForm.vehicleTypes
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
        await restrictionApi.create({
            roadSegmentId: road.id,
            zoneId: roadForm.zoneId || undefined,
            timeFrom: restrictionForm.timeFrom,
            timeTo: restrictionForm.timeTo,
            daysOfWeek: days,
            severity: restrictionForm.severity,
            description: restrictionForm.description || undefined,
            vehicleTypes: vtypes.length ? vtypes : undefined,
        });
        setModalOpen(false);
        await loadList();
        await fetchGeo();
    };

    const vehicleOptions = [
        { value: '', label: 'Mọi loại xe (hiển thị)' },
        { value: 'truck', label: 'Xe tải' },
        { value: 'van', label: 'Van' },
        { value: 'bike', label: 'Xe máy' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Quản lý cấm đường</h1>
                    <p className="mt-1 text-gray-500">Theo khung giờ (Asia/Ho_Chi_Minh) — tuyến đỏ: cấm, cam: hạn chế, xanh: khung được phép</p>
                </div>
                <Button onClick={() => setModalOpen(true)}>
                    <Plus size={18} className="mr-1" />
                    Thêm đoạn đường & quy định
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <h2 className="text-lg font-semibold">Mô phỏng theo thời điểm</h2>
                </CardHeader>
                <CardBody className="flex flex-wrap gap-4 items-end">
                    <div>
                        <label className="mb-1 block text-sm text-gray-600">Thời điểm xem</label>
                        <Input
                            type="datetime-local"
                            value={at}
                            onChange={(e) => setAt(e.target.value)}
                        />
                    </div>
                    <div className="w-48">
                        <label className="mb-1 block text-sm text-gray-600">Loại xe (lọc)</label>
                        <Select
                            options={vehicleOptions}
                            value={vehicleType}
                            onChange={(v) => setVehicleType(v)}
                        />
                    </div>
                    <Button variant="outline" onClick={() => fetchGeo()} disabled={mapLoading}>
                        <RefreshCw size={16} className={`mr-1 ${mapLoading ? 'animate-spin' : ''}`} />
                        Tải lại lớp bản đồ
                    </Button>
                </CardBody>
            </Card>

            {MAPBOX_TOKEN ? (
                <Card>
                    <CardBody className="p-0">
                        <div ref={mapContainerRef} className="h-[420px] w-full overflow-hidden rounded-b-lg" />
                        <p className="p-3 text-xs text-gray-500">
                            Nguồn: GET /restrictions/active/geojson — {geoJson?.features?.length ?? 0} đoạn hiển thị
                        </p>
                    </CardBody>
                </Card>
            ) : (
                <div className="rounded border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    Cấu hình NEXT_PUBLIC_MAPBOX_TOKEN để xem bản đồ.
                </div>
            )}

            <div className="grid grid-cols-3 gap-4">
                <Card>
                    <CardBody className="flex items-center gap-3">
                        <div className="rounded-xl bg-orange-100 p-3">
                            <Clock size={24} className="text-orange-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{restrictions.filter((r) => (r as { timeFrom?: string }).timeFrom).length}</p>
                            <p className="text-sm text-gray-500">Có khung giờ</p>
                        </div>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="flex items-center gap-3">
                        <div className="rounded-xl bg-green-100 p-3">
                            <Settings size={24} className="text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{restrictions.length}</p>
                            <p className="text-sm text-gray-500">Tổng quy định</p>
                        </div>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="flex items-center gap-3">
                        <div className="rounded-xl bg-blue-100 p-3">
                            <Truck size={24} className="text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{loading ? '…' : restrictions.filter((r) => (r as { vehicleTypes?: string[] }).vehicleTypes?.length).length}</p>
                            <p className="text-sm text-gray-500">Theo loại xe</p>
                        </div>
                    </CardBody>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <h2 className="text-lg font-semibold">Danh sách quy định (API)</h2>
                </CardHeader>
                <CardBody className="space-y-3">
                    {loading ? (
                        <p className="text-sm text-gray-500">Đang tải…</p>
                    ) : restrictions.length === 0 ? (
                        <p className="text-sm text-gray-500">Chưa có dữ liệu hoặc không có quyền đọc.</p>
                    ) : (
                        restrictions.map((r) => {
                            const x = r as {
                                id: string;
                                description?: string;
                                timeFrom?: string;
                                timeTo?: string;
                                daysOfWeek?: string[];
                                severity?: string;
                                zone?: { name?: string };
                                vehicleTypes?: string[];
                            };
                            const vt = x.vehicleTypes?.length ? x.vehicleTypes.join(', ') : 'mọi xe';
                            return (
                                <div key={x.id} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`h-10 w-2 rounded-full ${
                                                    x.severity === 'prohibited'
                                                        ? 'bg-red-600'
                                                        : x.severity === 'allowed_window'
                                                          ? 'bg-green-600'
                                                          : 'bg-orange-500'
                                                }`}
                                            />
                                            <div>
                                                <h3 className="font-semibold text-gray-800 dark:text-white">
                                                    {x.description || 'Quy định'}
                                                </h3>
                                                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                                                    <MapPin size={14} /> {x.zone?.name || '—'}
                                                    <span className="mx-1">•</span>
                                                    <Badge variant="secondary">{x.severity || 'restricted'}</Badge>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-4 pl-6 text-sm text-gray-600">
                                        {x.timeFrom && (
                                            <span>
                                                <Clock size={14} className="mr-1 inline" />
                                                {x.timeFrom} – {x.timeTo}
                                            </span>
                                        )}
                                        <span>
                                            <Truck size={14} className="mr-1 inline" />
                                            {vt}
                                        </span>
                                        {x.daysOfWeek?.length ? (
                                            <span>{x.daysOfWeek.join(', ')}</span>
                                        ) : null}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </CardBody>
            </Card>

            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title="Thêm đoạn đường + quy định"
                size="lg"
            >
                <form onSubmit={handleCreateChain} className="space-y-4">
                    <p className="text-sm text-gray-600">
                        Bước 1: GeoJSON LineString (tọa độ [lng, lat]). Bước 2: khung giờ áp dụng.
                    </p>
                    <Input
                        label="Tên đường / đoạn"
                        value={roadForm.name}
                        onChange={(e) => setRoadForm({ ...roadForm, name: e.target.value })}
                        required
                    />
                    <Select
                        label="Khu vực (tuỳ chọn)"
                        options={[{ value: '', label: '—' }, ...zones.map((z) => ({ value: z.id, label: z.name }))]}
                        value={roadForm.zoneId}
                        onChange={(v) => setRoadForm({ ...roadForm, zoneId: v })}
                    />
                    <div>
                        <label className="mb-1 block text-sm text-gray-600">Geometry (JSON LineString)</label>
                        <textarea
                            className="w-full rounded-lg border border-gray-300 p-2 font-mono text-xs dark:border-gray-600 dark:bg-gray-800"
                            rows={4}
                            value={roadForm.geometryJson}
                            onChange={(e) => setRoadForm({ ...roadForm, geometryJson: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Từ (HH:mm)"
                            value={restrictionForm.timeFrom}
                            onChange={(e) => setRestrictionForm({ ...restrictionForm, timeFrom: e.target.value })}
                        />
                        <Input
                            label="Đến (HH:mm)"
                            value={restrictionForm.timeTo}
                            onChange={(e) => setRestrictionForm({ ...restrictionForm, timeTo: e.target.value })}
                        />
                    </div>
                    <Input
                        label="Ngày trong tuần (Mon,Tue,...)"
                        value={restrictionForm.daysOfWeek}
                        onChange={(e) => setRestrictionForm({ ...restrictionForm, daysOfWeek: e.target.value })}
                    />
                    <Select
                        label="Mức độ (màu)"
                        options={[
                            { value: 'prohibited', label: 'Cấm (đỏ)' },
                            { value: 'restricted', label: 'Hạn chế (cam)' },
                            { value: 'allowed_window', label: 'Khung được (xanh)' },
                        ]}
                        value={restrictionForm.severity}
                        onChange={(v) => setRestrictionForm({ ...restrictionForm, severity: v })}
                    />
                    <Input
                        label="Loại xe (phân tách bằng dấu phẩy, để trống = mọi xe)"
                        value={restrictionForm.vehicleTypes}
                        onChange={(e) => setRestrictionForm({ ...restrictionForm, vehicleTypes: e.target.value })}
                    />
                    <Input
                        label="Mô tả"
                        value={restrictionForm.description}
                        onChange={(e) => setRestrictionForm({ ...restrictionForm, description: e.target.value })}
                    />
                    <div className="flex justify-end gap-2 border-t pt-4">
                        <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                            Hủy
                        </Button>
                        <Button type="submit">Tạo</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
