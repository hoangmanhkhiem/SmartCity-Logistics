'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN =
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN ||
    'pk.eyJ1Ijoia2hpZW1obTA0IiwiYSI6ImNtazNnc216ajBkZHgzZ3EyaWJ3OGFrZ2QifQ.3EGQJyiXL-oU1l1Ug4qfTQ';

mapboxgl.accessToken = MAPBOX_TOKEN;

interface FacilityMapPickerProps {
    latitude: number | null;
    longitude: number | null;
    pickEnabled: boolean;
    onPick: (lat: number, lng: number) => void;
    className?: string;
}

export default function FacilityMapPicker({
    latitude,
    longitude,
    pickEnabled,
    onPick,
    className = '',
}: FacilityMapPickerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const markerRef = useRef<mapboxgl.Marker | null>(null);
    const onPickRef = useRef(onPick);
    const pickRef = useRef(pickEnabled);

    onPickRef.current = onPick;
    pickRef.current = pickEnabled;

    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;
        const lat = latitude != null && !Number.isNaN(latitude) ? latitude : 21.0285;
        const lng = longitude != null && !Number.isNaN(longitude) ? longitude : 105.8542;
        const map = new mapboxgl.Map({
            container: containerRef.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: [lng, lat],
            zoom: 12,
        });
        map.addControl(new mapboxgl.NavigationControl(), 'top-right');
        mapRef.current = map;

        map.on('click', (e) => {
            if (!pickRef.current) return;
            const lngC = Number(e.lngLat.lng.toFixed(6));
            const latC = Number(e.lngLat.lat.toFixed(6));
            onPickRef.current(latC, lngC);
        });

        return () => {
            markerRef.current?.remove();
            map.remove();
            mapRef.current = null;
        };
    }, []);

    useEffect(() => {
        const map = mapRef.current;
        if (!map || latitude == null || longitude == null) return;
        if (Number.isNaN(latitude) || Number.isNaN(longitude)) return;

        if (markerRef.current) markerRef.current.remove();
        markerRef.current = new mapboxgl.Marker({ color: '#2563eb' })
            .setLngLat([longitude, latitude])
            .addTo(map);
        map.flyTo({ center: [longitude, latitude], essential: true });
    }, [latitude, longitude]);

    if (!MAPBOX_TOKEN) {
        return (
            <div className={`rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 ${className}`}>
                Thiếu NEXT_PUBLIC_MAPBOX_TOKEN
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <div ref={containerRef} className={`h-[220px] w-full overflow-hidden rounded-lg border border-gray-200 ${className}`} />
            <p className="text-xs text-gray-500">
                {pickEnabled ? 'Nhấp trên bản đồ để đặt vị trí cơ sở.' : 'Bật “Chọn trên bản đồ” để đặt lại tọa độ.'}
            </p>
        </div>
    );
}
