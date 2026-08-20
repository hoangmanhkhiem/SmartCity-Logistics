'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { zoneApi, restrictionApi } from '@/lib/api';
import { normalizeRestrictionFeatureCollection, normalizePolygonCoordinates } from '@/lib/geojson-lnglat';
import { Layers, Eye, EyeOff } from 'lucide-react';

interface ZoneFeature {
    id: number;
    name: string;
    type: string | null;
    description: string | null;
    polygon: GeoJSON.Polygon;
}

interface RestrictionInfo {
    description?: string;
    severity?: string;
    timeFrom?: string;
    timeTo?: string;
    zoneName?: string;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1Ijoia2hpZW1obTA0IiwiYSI6ImNtazNnc216ajBkZHgzZ3EyaWJ3OGFrZ2QifQ.3EGQJyiXL-oU1l1Ug4qfTQ';

mapboxgl.accessToken = MAPBOX_TOKEN;

export type GeoJsonFeatureCollection = {
    type: 'FeatureCollection';
    features: Array<{
        type: 'Feature';
        geometry: { type: 'LineString'; coordinates: number[][] };
        properties: Record<string, unknown>;
    }>;
};

interface MapProps {
    center?: [number, number]; // [lng, lat]
    zoom?: number;
    markers?: Array<{
        id: string | number;
        coordinates: [number, number];
        type?: 'vehicle' | 'facility' | 'destination' | 'warehouse' | 'charging_station' | 'fuel_station' | 'mfc' | 'pickup_point' | 'hub';
        label?: string;
        popup?: string;
    }>;
    route?: {
        start: [number, number];
        end: [number, number];
        vehicleProgress?: number; // 0-1, position along route
    };
    /** Điểm dừng đánh số thứ tự (Route detail / Shipper today-view). */
    stops?: Array<{
        id: string | number;
        coordinates: [number, number];
        sequence: number;
        type?: 'pickup' | 'delivery';
        status?: string;
        label?: string;
    }>;
    /** GeoJSON các đoạn đường cấm/hạn chế — vẽ layer line dùng property `color` có sẵn từ backend. */
    restrictionsGeoJson?: GeoJsonFeatureCollection;
    /** Tuyến đường tĩnh (đã tính sẵn từ backend, ví dụ chỉ đường né cấm) — vẽ thay vì tự fetch qua `route`. */
    staticRouteGeometry?: GeoJSON.LineString | null;
    /** Bật công cụ vẽ trực quan: 'polygon' cho zone, 'line' cho đoạn đường cấm. */
    drawMode?: 'polygon' | 'line' | null;
    /** Gọi khi user vẽ xong (create) hoặc chỉnh sửa (update) 1 hình. */
    onDrawComplete?: (feature: GeoJSON.Feature) => void;
    /** Hình có sẵn để hiển thị/chỉnh sửa khi vào chế độ vẽ (ví dụ sửa zone đã có). */
    initialDrawFeature?: GeoJSON.Feature | null;
    /** Tự fetch & vẽ lớp zone (vùng) + đường cấm/hạn chế đang hoạt động, kèm panel bật/tắt lớp + xem thông tin. */
    showZonesAndRestrictions?: boolean;
    className?: string;
    onMarkerClick?: (id: string | number) => void;
    onRouteLoaded?: (routeCoordinates: [number, number][]) => void;
}

const RESTRICTIONS_SOURCE_ID = 'restrictions-source';
const RESTRICTIONS_LAYER_ID = 'restrictions-layer';
const ZONES_SOURCE_ID = 'zones-source';
const ZONES_FILL_LAYER_ID = 'zones-fill-layer';
const ZONES_OUTLINE_LAYER_ID = 'zones-outline-layer';

export default function Map({
    center = [105.8542, 21.0285], // Hanoi default
    zoom = 12,
    markers = [],
    route,
    stops = [],
    restrictionsGeoJson,
    staticRouteGeometry,
    drawMode = null,
    onDrawComplete,
    initialDrawFeature,
    showZonesAndRestrictions = false,
    className = '',
    onMarkerClick,
    onRouteLoaded,
}: MapProps) {
    const mapContainer = useRef<HTMLDivElement>(null);
    const legendContainer = useRef<HTMLDivElement | null>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const markersRef = useRef<mapboxgl.Marker[]>([]);
    const [loaded, setLoaded] = useState(false);
    const routeLayerAdded = useRef(false);
    const draw = useRef<MapboxDraw | null>(null);

    const [zones, setZones] = useState<ZoneFeature[]>([]);
    const [autoRestrictions, setAutoRestrictions] = useState<GeoJsonFeatureCollection>({ type: 'FeatureCollection', features: [] });
    const [showZonesLayer, setShowZonesLayer] = useState(true);
    const [showRestrictionsLayer, setShowRestrictionsLayer] = useState(true);
    const [inspected, setInspected] = useState<{ kind: 'zone'; data: ZoneFeature } | { kind: 'restriction'; data: RestrictionInfo } | null>(null);

    // Fetch route from Mapbox Directions API
    const fetchRoute = useCallback(async (start: [number, number], end: [number, number]) => {
        try {
            const response = await fetch(
                `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson&access_token=${MAPBOX_TOKEN}`
            );
            const data = await response.json();

            if (data.routes && data.routes[0]) {
                const coordinates = data.routes[0].geometry.coordinates as [number, number][];

                // Draw route on map
                if (map.current && loaded) {
                    const sourceId = 'route';

                    if (map.current.getSource(sourceId)) {
                        (map.current.getSource(sourceId) as mapboxgl.GeoJSONSource).setData({
                            type: 'Feature',
                            properties: {},
                            geometry: {
                                type: 'LineString',
                                coordinates,
                            },
                        });
                    } else {
                        map.current.addSource(sourceId, {
                            type: 'geojson',
                            data: {
                                type: 'Feature',
                                properties: {},
                                geometry: {
                                    type: 'LineString',
                                    coordinates,
                                },
                            },
                        });

                        map.current.addLayer({
                            id: 'route',
                            type: 'line',
                            source: 'route',
                            layout: {
                                'line-join': 'round',
                                'line-cap': 'round',
                            },
                            paint: {
                                'line-color': '#3B82F6',
                                'line-width': 5,
                                'line-opacity': 0.75,
                            },
                        });

                        routeLayerAdded.current = true;
                    }
                }

                onRouteLoaded?.(coordinates);
                return coordinates;
            }
        } catch (error) {
            console.error('Failed to fetch route:', error);
        }
        return null;
    }, [loaded, onRouteLoaded]);

    // Tự fetch zone + đường cấm/hạn chế đang hoạt động khi bật showZonesAndRestrictions
    useEffect(() => {
        if (!showZonesAndRestrictions) return;
        let cancelled = false;
        zoneApi.getAll({ limit: 200 }).then((res) => {
            if (cancelled) return;
            const list = (res.data?.data ?? res.data ?? []) as Array<{ id: number; name: string; type: string | null; description: string | null; boundary?: string | null }>;
            const parsed: ZoneFeature[] = [];
            for (const z of list) {
                if (!z.boundary) continue;
                try {
                    const geom = JSON.parse(z.boundary) as GeoJSON.Polygon;
                    if (geom.type !== 'Polygon') continue;
                    parsed.push({
                        id: z.id,
                        name: z.name,
                        type: z.type,
                        description: z.description,
                        polygon: { type: 'Polygon', coordinates: normalizePolygonCoordinates(geom.coordinates) },
                    });
                } catch {
                    /* bỏ qua boundary không hợp lệ */
                }
            }
            setZones(parsed);
        }).catch(() => setZones([]));

        restrictionApi.getActiveGeoJson({ at: new Date().toISOString() }).then((res) => {
            if (cancelled) return;
            setAutoRestrictions(normalizeRestrictionFeatureCollection(res.data) as GeoJsonFeatureCollection);
        }).catch(() => setAutoRestrictions({ type: 'FeatureCollection', features: [] }));

        return () => { cancelled = true; };
    }, [showZonesAndRestrictions]);

    useEffect(() => {
        if (!mapContainer.current || map.current) return;

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center,
            zoom,
        });

        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

        if (showZonesAndRestrictions) {
            const legendEl = document.createElement('div');
            legendContainer.current = legendEl;
            const legendControl: mapboxgl.IControl = {
                onAdd: () => legendEl,
                onRemove: () => { legendEl.parentNode?.removeChild(legendEl); },
            };
            map.current.addControl(legendControl, 'bottom-left');
        }

        map.current.on('load', () => {
            map.current!.addSource(RESTRICTIONS_SOURCE_ID, {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] },
            });
            map.current!.addLayer({
                id: RESTRICTIONS_LAYER_ID,
                type: 'line',
                source: RESTRICTIONS_SOURCE_ID,
                layout: { 'line-join': 'round', 'line-cap': 'round' },
                paint: {
                    'line-color': ['coalesce', ['get', 'color'], '#ea580c'],
                    'line-width': 4,
                    'line-dasharray': [2, 1],
                },
            });

            map.current!.addSource(ZONES_SOURCE_ID, {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] },
            });
            map.current!.addLayer({
                id: ZONES_FILL_LAYER_ID,
                type: 'fill',
                source: ZONES_SOURCE_ID,
                paint: { 'fill-color': '#6366f1', 'fill-opacity': 0.12 },
            });
            map.current!.addLayer({
                id: ZONES_OUTLINE_LAYER_ID,
                type: 'line',
                source: ZONES_SOURCE_ID,
                layout: { 'line-join': 'round', 'line-cap': 'round' },
                paint: { 'line-color': '#6366f1', 'line-width': 2 },
            });

            setLoaded(true);
        });

        return () => {
            map.current?.remove();
            map.current = null;
            legendContainer.current = null;
            routeLayerAdded.current = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Update center when prop changes
    useEffect(() => {
        if (map.current && loaded) {
            map.current.flyTo({ center, zoom, duration: 1000 });
        }
    }, [center[0], center[1], zoom, loaded]);

    // Fetch route when route prop changes
    useEffect(() => {
        if (route && loaded) {
            fetchRoute(route.start, route.end);
        }
    }, [route?.start[0], route?.start[1], route?.end[0], route?.end[1], loaded, fetchRoute]);

    // Update restrictions layer — ưu tiên restrictionsGeoJson truyền tay, nếu không có thì dùng dữ liệu tự fetch
    const effectiveRestrictions = restrictionsGeoJson ?? (showZonesAndRestrictions ? autoRestrictions : undefined);
    useEffect(() => {
        if (!map.current || !loaded) return;
        const source = map.current.getSource(RESTRICTIONS_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
        if (source) {
            source.setData(effectiveRestrictions ?? { type: 'FeatureCollection', features: [] });
        }
    }, [effectiveRestrictions, loaded]);

    // Update zones layer (fill + outline) khi dữ liệu zone tự fetch thay đổi
    useEffect(() => {
        if (!map.current || !loaded) return;
        const source = map.current.getSource(ZONES_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
        if (!source) return;
        source.setData({
            type: 'FeatureCollection',
            features: zones.map((z) => ({
                type: 'Feature',
                properties: { id: z.id, name: z.name, type: z.type, description: z.description },
                geometry: z.polygon,
            })),
        });
    }, [zones, loaded]);

    // Bật/tắt hiển thị lớp zone / đường cấm theo panel legend
    useEffect(() => {
        if (!map.current || !loaded) return;
        const visibility = showZonesLayer ? 'visible' : 'none';
        if (map.current.getLayer(ZONES_FILL_LAYER_ID)) map.current.setLayoutProperty(ZONES_FILL_LAYER_ID, 'visibility', visibility);
        if (map.current.getLayer(ZONES_OUTLINE_LAYER_ID)) map.current.setLayoutProperty(ZONES_OUTLINE_LAYER_ID, 'visibility', visibility);
    }, [showZonesLayer, loaded]);

    useEffect(() => {
        if (!map.current || !loaded) return;
        const visibility = showRestrictionsLayer ? 'visible' : 'none';
        if (map.current.getLayer(RESTRICTIONS_LAYER_ID)) map.current.setLayoutProperty(RESTRICTIONS_LAYER_ID, 'visibility', visibility);
    }, [showRestrictionsLayer, loaded]);

    // Click để xem thông tin zone / đường cấm
    useEffect(() => {
        if (!map.current || !loaded || !showZonesAndRestrictions) return;
        const m = map.current;

        const handleZoneClick = (e: mapboxgl.MapMouseEvent) => {
            const found = zones.find((z) => z.id === e.features?.[0]?.properties?.id);
            if (found) setInspected({ kind: 'zone', data: found });
        };
        const handleRestrictionClick = (e: mapboxgl.MapMouseEvent) => {
            const props = e.features?.[0]?.properties as RestrictionInfo | undefined;
            if (props) setInspected({ kind: 'restriction', data: props });
        };
        const setPointer = () => { m.getCanvas().style.cursor = 'pointer'; };
        const unsetPointer = () => { m.getCanvas().style.cursor = ''; };

        m.on('click', ZONES_FILL_LAYER_ID, handleZoneClick);
        m.on('click', RESTRICTIONS_LAYER_ID, handleRestrictionClick);
        m.on('mouseenter', ZONES_FILL_LAYER_ID, setPointer);
        m.on('mouseleave', ZONES_FILL_LAYER_ID, unsetPointer);
        m.on('mouseenter', RESTRICTIONS_LAYER_ID, setPointer);
        m.on('mouseleave', RESTRICTIONS_LAYER_ID, unsetPointer);

        return () => {
            m.off('click', ZONES_FILL_LAYER_ID, handleZoneClick);
            m.off('click', RESTRICTIONS_LAYER_ID, handleRestrictionClick);
            m.off('mouseenter', ZONES_FILL_LAYER_ID, setPointer);
            m.off('mouseleave', ZONES_FILL_LAYER_ID, unsetPointer);
            m.off('mouseenter', RESTRICTIONS_LAYER_ID, setPointer);
            m.off('mouseleave', RESTRICTIONS_LAYER_ID, unsetPointer);
        };
    }, [zones, loaded, showZonesAndRestrictions]);

    // Vẽ tuyến đường tĩnh đã tính sẵn (ví dụ chỉ đường né cấm từ backend)
    useEffect(() => {
        if (!map.current || !loaded) return;
        const sourceId = 'static-route';
        const source = map.current.getSource(sourceId) as mapboxgl.GeoJSONSource | undefined;
        const data: GeoJSON.Feature = {
            type: 'Feature',
            properties: {},
            geometry: staticRouteGeometry ?? { type: 'LineString', coordinates: [] },
        };
        if (source) {
            source.setData(data);
        } else if (staticRouteGeometry) {
            map.current.addSource(sourceId, { type: 'geojson', data });
            map.current.addLayer({
                id: sourceId,
                type: 'line',
                source: sourceId,
                layout: { 'line-join': 'round', 'line-cap': 'round' },
                paint: { 'line-color': '#3B82F6', 'line-width': 5, 'line-opacity': 0.75 },
            });
        }
    }, [staticRouteGeometry, loaded]);

    // Bật/tắt công cụ vẽ polygon/line trực quan (zone / đoạn đường cấm)
    useEffect(() => {
        if (!map.current || !loaded) return;

        if (!drawMode) {
            if (draw.current) {
                map.current.removeControl(draw.current);
                draw.current = null;
            }
            return;
        }

        const mbDraw = new MapboxDraw({
            displayControlsDefault: false,
            controls: { trash: true },
            defaultMode: drawMode === 'polygon' ? 'draw_polygon' : 'draw_line_string',
        });
        draw.current = mbDraw;
        map.current.addControl(mbDraw, 'top-left');

        if (initialDrawFeature) {
            mbDraw.add(initialDrawFeature);
            mbDraw.changeMode('simple_select');
        }

        const handleChange = () => {
            const data = mbDraw.getAll();
            const feature = data.features[data.features.length - 1];
            if (feature) onDrawComplete?.(feature);
        };

        map.current.on('draw.create', handleChange);
        map.current.on('draw.update', handleChange);

        return () => {
            map.current?.off('draw.create', handleChange);
            map.current?.off('draw.update', handleChange);
            if (draw.current) {
                map.current?.removeControl(draw.current);
                draw.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [drawMode, loaded]);

    // Update markers
    useEffect(() => {
        if (!map.current || !loaded) return;

        // Remove old markers
        markersRef.current.forEach(m => m.remove());
        markersRef.current = [];

        // Add new markers
        markers.forEach((marker) => {
            const el = document.createElement('div');
            el.className = 'map-marker';

            const colors: Record<NonNullable<typeof marker.type>, string> = {
                vehicle: '#4F46E5',
                facility: '#10B981',
                destination: '#EF4444',
                hub: '#10B981',
                warehouse: '#8B5CF6',
                charging_station: '#06B6D4',
                fuel_station: '#F97316',
                mfc: '#EC4899',
                pickup_point: '#EC4899',
            };
            const color = colors[marker.type || 'vehicle'];

            const icons: Record<NonNullable<typeof marker.type>, string> = {
                vehicle:
                    '<svg width="18" height="18" fill="white" viewBox="0 0 24 24"><path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>',
                facility:
                    '<svg width="18" height="18" fill="white" viewBox="0 0 24 24"><path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/></svg>',
                hub: '<svg width="18" height="18" fill="white" viewBox="0 0 24 24"><path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/></svg>',
                warehouse:
                    '<svg width="18" height="18" fill="white" viewBox="0 0 24 24"><path d="M22 21V8l-10-6L2 8v13h6v-8h8v8h6z"/></svg>',
                charging_station:
                    '<svg width="18" height="18" fill="white" viewBox="0 0 24 24"><path d="M11 21h-1l1-7H7.5c-.58 0-.57-.32-.38-.66.19-.34.05-.08.07-.12C8.48 10.94 10.42 7.54 13 3h1l-1 7h3.5c.49 0 .56.33.47.51l-.07.15C12.96 17.55 11 21 11 21z"/></svg>',
                fuel_station:
                    '<svg width="18" height="18" fill="white" viewBox="0 0 24 24"><path d="M19.77 7.23l.01-.01-3.72-3.72L15 4.56l2.11 2.11c-.94.36-1.61 1.26-1.61 2.33 0 1.38 1.12 2.5 2.5 2.5.36 0 .69-.08 1-.21v7.21c0 .55-.45 1-1 1s-1-.45-1-1V14c0-1.1-.9-2-2-2h-1V5c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v16h10v-7.5h1.5v5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V9c0-.69-.28-1.32-.73-1.77zM12 9H6V5h6v4z"/></svg>',
                mfc: '<svg width="18" height="18" fill="white" viewBox="0 0 24 24"><path d="M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 8.76l1-1.36 1 1.36L15.38 12 17 10.83 14.92 8H20v6z"/></svg>',
                pickup_point:
                    '<svg width="18" height="18" fill="white" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>',
                destination:
                    '<svg width="18" height="18" fill="white" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>',
            };

            el.innerHTML = `
                <div style="
                    width: 36px;
                    height: 36px;
                    background: ${color};
                    border-radius: 50%;
                    border: 3px solid white;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: transform 0.3s ease;
                ">
                    ${icons[marker.type || 'vehicle']}
                </div>
            `;

            if (onMarkerClick) {
                el.addEventListener('click', () => onMarkerClick(marker.id));
            }

            const mapMarker = new mapboxgl.Marker({ element: el })
                .setLngLat(marker.coordinates)
                .addTo(map.current!);

            if (marker.popup) {
                mapMarker.setPopup(
                    new mapboxgl.Popup({ offset: 25 }).setHTML(
                        `<div style="font-family: system-ui; padding: 4px 8px;">
                            <strong>${marker.label || ''}</strong>
                            <p style="margin: 4px 0 0; font-size: 12px;">${marker.popup}</p>
                        </div>`
                    )
                );
            }

            markersRef.current.push(mapMarker);
        });

        // Stop markers (đánh số thứ tự — pickup xanh lá, delivery cam)
        stops.forEach((stop) => {
            const el = document.createElement('div');
            el.className = 'map-marker-stop';
            const bg = stop.type === 'pickup' ? '#10B981' : '#F59E0B';
            const isDone = stop.status === 'completed';
            el.innerHTML = `
                <div style="
                    width: 32px;
                    height: 32px;
                    background: ${isDone ? '#9CA3AF' : bg};
                    border-radius: 50%;
                    border: 3px solid white;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    color: white;
                    font-family: system-ui;
                    font-size: 13px;
                    font-weight: 700;
                    ${isDone ? 'text-decoration: line-through;' : ''}
                ">${stop.sequence}</div>
            `;
            if (onMarkerClick) {
                el.addEventListener('click', () => onMarkerClick(stop.id));
            }
            const mapMarker = new mapboxgl.Marker({ element: el }).setLngLat(stop.coordinates).addTo(map.current!);
            if (stop.label) {
                mapMarker.setPopup(
                    new mapboxgl.Popup({ offset: 22 }).setHTML(
                        `<div style="font-family: system-ui; padding: 4px 8px;"><strong>#${stop.sequence} — ${stop.type === 'pickup' ? 'Lấy hàng' : 'Giao hàng'}</strong><p style="margin: 4px 0 0; font-size: 12px;">${stop.label}</p></div>`,
                    ),
                );
            }
            markersRef.current.push(mapMarker);
        });
    }, [markers, stops, loaded, onMarkerClick]);

    const restrictionCount = effectiveRestrictions?.features.length ?? 0;

    return (
        <div className={`relative w-full h-full rounded-lg overflow-hidden ${className}`}>
            <div ref={mapContainer} className="w-full h-full" />

            {showZonesAndRestrictions && legendContainer.current && createPortal(
                <div className="m-2 min-w-[190px] rounded-lg border border-slate-200 bg-white/95 p-2.5 text-xs shadow-lg backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
                    <p className="mb-1.5 flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-200">
                        <Layers size={13} /> Lớp bản đồ
                    </p>
                    <button
                        type="button"
                        onClick={() => setShowZonesLayer((v) => !v)}
                        className="flex w-full items-center justify-between gap-2 rounded px-1.5 py-1 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                        <span className="flex items-center gap-1.5">
                            <span className="inline-block h-2.5 w-2.5 rounded-sm border border-indigo-500 bg-indigo-500/30" />
                            Vùng / Zone ({zones.length})
                        </span>
                        {showZonesLayer ? <Eye size={14} /> : <EyeOff size={14} className="text-slate-400" />}
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowRestrictionsLayer((v) => !v)}
                        className="flex w-full items-center justify-between gap-2 rounded px-1.5 py-1 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                        <span className="flex items-center gap-1.5">
                            <span className="inline-block h-0.5 w-2.5 rounded-sm bg-orange-500" />
                            Đường cấm/hạn chế ({restrictionCount})
                        </span>
                        {showRestrictionsLayer ? <Eye size={14} /> : <EyeOff size={14} className="text-slate-400" />}
                    </button>

                    {inspected && (
                        <div className="mt-2 border-t border-slate-200 pt-2 dark:border-slate-700">
                            {inspected.kind === 'zone' ? (
                                <>
                                    <p className="font-semibold text-slate-800 dark:text-white">{inspected.data.name}</p>
                                    {inspected.data.type && <p className="text-slate-500">Loại: {inspected.data.type}</p>}
                                    {inspected.data.description && <p className="mt-0.5 text-slate-500">{inspected.data.description}</p>}
                                </>
                            ) : (
                                <>
                                    <p className="font-semibold text-slate-800 dark:text-white">{inspected.data.description || 'Đường cấm/hạn chế'}</p>
                                    {inspected.data.zoneName && <p className="text-slate-500">Khu vực: {inspected.data.zoneName}</p>}
                                    {inspected.data.timeFrom && <p className="text-slate-500">Giờ: {inspected.data.timeFrom} – {inspected.data.timeTo}</p>}
                                    {inspected.data.severity && <p className="text-slate-500">Mức độ: {inspected.data.severity}</p>}
                                </>
                            )}
                            <button type="button" onClick={() => setInspected(null)} className="mt-1 text-indigo-600 hover:underline">
                                Đóng
                            </button>
                        </div>
                    )}
                </div>,
                legendContainer.current,
            )}
        </div>
    );
}

// Helper function to get position along route
export function getPositionAlongRoute(
    routeCoordinates: [number, number][],
    progress: number // 0-1
): [number, number] {
    if (!routeCoordinates.length) return [105.8542, 21.0285];
    if (progress <= 0) return routeCoordinates[0];
    if (progress >= 1) return routeCoordinates[routeCoordinates.length - 1];

    const totalPoints = routeCoordinates.length - 1;
    const exactIndex = progress * totalPoints;
    const index = Math.floor(exactIndex);
    const fraction = exactIndex - index;

    const start = routeCoordinates[index];
    const end = routeCoordinates[Math.min(index + 1, routeCoordinates.length - 1)];

    return [
        start[0] + (end[0] - start[0]) * fraction,
        start[1] + (end[1] - start[1]) * fraction,
    ];
}
