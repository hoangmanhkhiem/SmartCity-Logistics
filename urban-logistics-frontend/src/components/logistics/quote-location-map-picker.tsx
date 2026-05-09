'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN =
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN ||
    'pk.eyJ1Ijoia2hpZW1obTA0IiwiYSI6ImNtazNnc216ajBkZHgzZ3EyaWJ3OGFrZ2QifQ.3EGQJyiXL-oU1l1Ug4qfTQ';

mapboxgl.accessToken = MAPBOX_TOKEN;

export interface QuoteMapPoint {
    lat: number;
    lng: number;
}

interface QuoteLocationMapPickerProps {
    pickup: QuoteMapPoint;
    delivery: QuoteMapPoint;
    activeTarget: 'pickup' | 'delivery';
    onPickupChange: (lat: number, lng: number) => void;
    onDeliveryChange: (lat: number, lng: number) => void;
    className?: string;
}

function makePin(label: string, bg: string) {
    const el = document.createElement('div');
    el.innerHTML = `
        <div style="
            min-width: 28px; height: 28px; padding: 0 6px;
            background: ${bg}; color: white; font-size: 11px; font-weight: 700;
            border-radius: 9999px; border: 2px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.35);
            display: flex; align-items: center; justify-content: center;
            cursor: grab;
        ">${label}</div>`;
    return el;
}

export default function QuoteLocationMapPicker({
    pickup,
    delivery,
    activeTarget,
    onPickupChange,
    onDeliveryChange,
    className = '',
}: QuoteLocationMapPickerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const pickupMarkerRef = useRef<mapboxgl.Marker | null>(null);
    const deliveryMarkerRef = useRef<mapboxgl.Marker | null>(null);
    const activeTargetRef = useRef(activeTarget);
    const callbacksRef = useRef({ onPickupChange, onDeliveryChange });
    const pickupRef = useRef(pickup);
    const deliveryRef = useRef(delivery);

    activeTargetRef.current = activeTarget;
    callbacksRef.current = { onPickupChange, onDeliveryChange };
    pickupRef.current = pickup;
    deliveryRef.current = delivery;

    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;

        const p0 = pickupRef.current;
        const d0 = deliveryRef.current;
        const midLat = (p0.lat + d0.lat) / 2;
        const midLng = (p0.lng + d0.lng) / 2;

        const map = new mapboxgl.Map({
            container: containerRef.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: [midLng, midLat],
            zoom: 11,
        });
        map.addControl(new mapboxgl.NavigationControl(), 'top-right');
        mapRef.current = map;

        map.on('click', (e) => {
            const { lng, lat } = e.lngLat;
            const t = activeTargetRef.current;
            if (t === 'pickup') callbacksRef.current.onPickupChange(lat, lng);
            else callbacksRef.current.onDeliveryChange(lat, lng);
        });

        map.on('load', () => {
            const p = pickupRef.current;
            const d = deliveryRef.current;
            const pm = new mapboxgl.Marker({
                element: makePin('L', '#16a34a'),
                draggable: true,
            })
                .setLngLat([p.lng, p.lat])
                .addTo(map);
            pm.on('dragend', () => {
                const ll = pm.getLngLat();
                callbacksRef.current.onPickupChange(ll.lat, ll.lng);
            });
            pickupMarkerRef.current = pm;

            const dm = new mapboxgl.Marker({
                element: makePin('G', '#dc2626'),
                draggable: true,
            })
                .setLngLat([d.lng, d.lat])
                .addTo(map);
            dm.on('dragend', () => {
                const ll = dm.getLngLat();
                callbacksRef.current.onDeliveryChange(ll.lat, ll.lng);
            });
            deliveryMarkerRef.current = dm;
        });

        return () => {
            pickupMarkerRef.current?.remove();
            deliveryMarkerRef.current?.remove();
            pickupMarkerRef.current = null;
            deliveryMarkerRef.current = null;
            map.remove();
            mapRef.current = null;
        };
        // Map chỉ tạo một lần; tọa độ cập nhật qua effect bên dưới
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!pickupMarkerRef.current) return;
        pickupMarkerRef.current.setLngLat([pickup.lng, pickup.lat]);
    }, [pickup.lat, pickup.lng]);

    useEffect(() => {
        if (!deliveryMarkerRef.current) return;
        deliveryMarkerRef.current.setLngLat([delivery.lng, delivery.lat]);
    }, [delivery.lat, delivery.lng]);

    return <div ref={containerRef} className={`w-full h-full min-h-[300px] rounded-lg overflow-hidden ${className}`} />;
}
