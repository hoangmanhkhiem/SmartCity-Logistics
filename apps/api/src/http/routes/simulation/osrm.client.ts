import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { haversineKm } from '../../middlewares/utils/geo';

export type OsrmProfile = 'driving' | 'bike' | 'foot';

@Injectable()
export class OsrmClient {
    private readonly log = new Logger(OsrmClient.name);

    constructor(private readonly config: ConfigService) {}

    baseUrl() {
        return (this.config.get<string>('osrmUrl') || process.env.OSRM_URL || '').replace(/\/$/, '');
    }

    async route(
        from: [number, number],
        to: [number, number],
        profile: OsrmProfile = 'driving',
        liveDirections = false,
    ): Promise<{ coordinates: [number, number][]; distanceKm: number; durationMin: number }> {
        const osrm = await this.tryOsrm(from, to, profile);
        if (osrm) return osrm;
        if (liveDirections) {
            const mapbox = await this.tryMapbox(from, to, profile);
            if (mapbox) return mapbox;
            throw new Error('Chưa có dịch vụ chỉ đường. Đặt OSRM_URL hoặc MAPBOX_ACCESS_TOKEN — không vẽ đường chim bay.');
        }
        return this.greatCircle(from, to, profile);
    }

    private async tryOsrm(from: [number, number], to: [number, number], profile: OsrmProfile) {
        const url = this.baseUrl();
        if (!url) return null;
        try {
            const path = `${url}/route/v1/${profile}/${from[0]},${from[1]};${to[0]},${to[1]}?overview=full&geometries=geojson`;
            const res = await fetch(path, { signal: AbortSignal.timeout(4000) });
            if (!res.ok) return null;
            const json = (await res.json()) as {
                routes?: Array<{ distance: number; duration: number; geometry?: { coordinates: number[][] } }>;
            };
            const r = json.routes?.[0];
            if (!r?.geometry?.coordinates?.length) return null;
            return {
                coordinates: r.geometry.coordinates.map((c) => [c[0], c[1]] as [number, number]),
                distanceKm: r.distance / 1000,
                durationMin: r.duration / 60,
            };
        } catch (err) {
            this.log.warn(`OSRM: ${err instanceof Error ? err.message : String(err)}`);
            return null;
        }
    }

    private async tryMapbox(from: [number, number], to: [number, number], profile: OsrmProfile) {
        const token =
            this.config.get<string>('mapboxAccessToken') ||
            this.config.get<string>('MAPBOX_ACCESS_TOKEN') ||
            process.env.MAPBOX_ACCESS_TOKEN ||
            '';
        if (!token) return null;
        const mbProfile = profile === 'bike' ? 'cycling' : profile === 'foot' ? 'walking' : 'driving';
        const url =
            `https://api.mapbox.com/directions/v5/mapbox/${mbProfile}/` +
            `${from[0]},${from[1]};${to[0]},${to[1]}` +
            `?geometries=geojson&overview=full&access_token=${encodeURIComponent(token)}`;
        try {
            const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
            if (!res.ok) {
                this.log.warn(`Mapbox Directions ${res.status}: ${(await res.text()).slice(0, 180)}`);
                return null;
            }
            const json = (await res.json()) as {
                routes?: Array<{ distance: number; duration: number; geometry?: { coordinates: number[][] } }>;
            };
            const r = json.routes?.[0];
            if (!r?.geometry?.coordinates?.length) return null;
            return {
                coordinates: r.geometry.coordinates.map((c) => [c[0], c[1]] as [number, number]),
                distanceKm: r.distance / 1000,
                durationMin: r.duration / 60,
            };
        } catch (err) {
            this.log.warn(`Mapbox Directions: ${err instanceof Error ? err.message : String(err)}`);
            return null;
        }
    }

    private greatCircle(
        from: [number, number],
        to: [number, number],
        profile: OsrmProfile,
    ) {
        const km = haversineKm(from[1], from[0], to[1], to[0]);
        const steps = Math.max(4, Math.min(12, Math.round(km / 2)));
        const coordinates: [number, number][] = [];
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            coordinates.push([from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t]);
        }
        const speed = profile === 'bike' ? 22 : profile === 'foot' ? 5 : 32;
        return { coordinates, distanceKm: km, durationMin: (km / speed) * 60 };
    }
}
