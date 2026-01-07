'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'sk.eyJ1Ijoia2hpZW1obTA0IiwiYSI6ImNtazNpMWxobTBzZnozaXBlZGd4c3ZkczUifQ.rnjeaXXw0T4-5CCEtsZiMQ';

mapboxgl.accessToken = MAPBOX_TOKEN;

interface MapProps {
    center?: [number, number]; // [lng, lat]
    zoom?: number;
    markers?: Array<{
        id: string;
        coordinates: [number, number];
        type?: 'vehicle' | 'facility' | 'destination';
        label?: string;
        popup?: string;
    }>;
    className?: string;
    onMarkerClick?: (id: string) => void;
}

export default function Map({
    center = [105.8542, 21.0285], // Hanoi default
    zoom = 12,
    markers = [],
    className = '',
    onMarkerClick,
}: MapProps) {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const markersRef = useRef<mapboxgl.Marker[]>([]);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        if (!mapContainer.current || map.current) return;

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center,
            zoom,
        });

        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

        map.current.on('load', () => {
            setLoaded(true);
        });

        return () => {
            map.current?.remove();
            map.current = null;
        };
    }, []);

    // Update center when prop changes
    useEffect(() => {
        if (map.current && loaded) {
            map.current.flyTo({ center, zoom, duration: 1000 });
        }
    }, [center[0], center[1], zoom, loaded]);

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

            // Marker styles based on type
            const colors = {
                vehicle: '#3B82F6',
                facility: '#10B981',
                destination: '#EF4444',
            };
            const color = colors[marker.type || 'vehicle'];

            el.innerHTML = `
                <div style="
                    width: 32px;
                    height: 32px;
                    background: ${color};
                    border-radius: 50%;
                    border: 3px solid white;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                ">
                    ${marker.type === 'vehicle'
                    ? '<svg width="16" height="16" fill="white" viewBox="0 0 24 24"><path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>'
                    : marker.type === 'facility'
                        ? '<svg width="16" height="16" fill="white" viewBox="0 0 24 24"><path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/></svg>'
                        : '<svg width="16" height="16" fill="white" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>'
                }
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
                            <p style="margin: 4px 0 0;">${marker.popup}</p>
                        </div>`
                    )
                );
            }

            markersRef.current.push(mapMarker);
        });
    }, [markers, loaded]);

    return (
        <div
            ref={mapContainer}
            className={`w-full h-full min-h-[300px] rounded-lg overflow-hidden ${className}`}
        />
    );
}
