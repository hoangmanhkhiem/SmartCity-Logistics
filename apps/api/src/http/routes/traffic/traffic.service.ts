import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SpeedProfile, TrafficProbe, TrafficQuota, TrafficSample } from '../../../db/entities/traffic.entity';

const WARDS = [
    { ward: 'Hoàn Kiếm', lat: 21.0305, lon: 105.852 },
    { ward: 'Cửa Nam', lat: 21.0245, lon: 105.8415 },
    { ward: 'Ba Đình', lat: 21.0355, lon: 105.834 },
    { ward: 'Cầu Giấy', lat: 21.0368, lon: 105.7905 },
    { ward: 'Đống Đa', lat: 21.0155, lon: 105.827 },
    { ward: 'Giảng Võ', lat: 21.0272, lon: 105.8225 },
];

const PEAK_HOURS = [7, 8, 16, 17, 18];

@Injectable()
export class TrafficService implements OnModuleInit {
    private timer: NodeJS.Timeout | null = null;
    private lastLiveAt = 0;
    private lastAggDay = '';

    constructor(
        @InjectRepository(TrafficProbe) private readonly probes: Repository<TrafficProbe>,
        @InjectRepository(TrafficSample) private readonly samples: Repository<TrafficSample>,
        @InjectRepository(SpeedProfile) private readonly profiles: Repository<SpeedProfile>,
        @InjectRepository(TrafficQuota) private readonly quota: Repository<TrafficQuota>,
    ) {}

    async onModuleInit() {
        await this.ensureProbes().catch(() => undefined);
        await this.ensureDemoSamples().catch(() => undefined);
        await this.aggregate().catch(() => undefined);
        this.timer = setInterval(() => {
            this.tick().catch(() => undefined);
        }, 60_000);
    }

    onModuleDestroy() {
        if (this.timer) clearInterval(this.timer);
    }

    async ensureProbes() {
        const count = await this.probes.count();
        if (count > 0) return { probes: count };
        let n = 0;
        for (const ward of WARDS) {
            for (let i = 0; i < 6; i++) {
                const lat = ward.lat + ((i % 3) - 1) * 0.004;
                const lon = ward.lon + (Math.floor(i / 3) - 0.5) * 0.005;
                await this.probes.save(this.probes.create({
                    name: `${ward.ward} · đoạn ${i + 1}`,
                    ward: ward.ward,
                    latitude: lat,
                    longitude: lon,
                    isActive: true,
                }));
                n++;
            }
        }
        return { probes: n };
    }

    private monthKey(date = new Date()) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }

    private monthlyLimit() {
        const n = Number(process.env.TOMTOM_MONTHLY_LIMIT ?? 20000);
        return Number.isFinite(n) && n > 0 ? n : 20000;
    }

    private async quotaRow() {
        const monthKey = this.monthKey();
        let row = await this.quota.findOne({ where: { monthKey } });
        if (!row) {
            row = await this.quota.save(this.quota.create({ monthKey, used: 0, monthlyLimit: this.monthlyLimit() }));
        }
        row.monthlyLimit = this.monthlyLimit();
        return row;
    }

    async quotaStatus() {
        const row = await this.quotaRow();
        const ratio = row.monthlyLimit ? row.used / row.monthlyLimit : 0;
        return {
            month: row.monthKey,
            used: row.used,
            limit: row.monthlyLimit,
            ratio,
            stopped: ratio >= 0.9,
            provider: 'TomTom Traffic Flow',
            map: 'Mapbox',
            retainRaw: process.env.TOMTOM_RETAIN_RAW !== 'false',
            note: 'Worker dừng khi chạm 90% hạn mức tháng. Không dùng Google. Nếu điều khoản không cho giữ mẫu thô, đặt TOMTOM_RETAIN_RAW=false.',
        };
    }

    private dayType(date: Date) {
        const day = date.getDay();
        return day === 0 || day === 6 ? 'weekend' : 'weekday';
    }

    private syntheticSpeed(hour: number, index: number) {
        const peak = PEAK_HOURS.includes(hour);
        const freeFlow = 32;
        const current = peak ? 14 + (index % 5) : 26 + (index % 4);
        return { current, freeFlow, confidence: peak ? 0.72 : 0.4 };
    }

    async ensureDemoSamples() {
        const existing = await this.samples.count();
        if (existing > 0) return { seeded: false };
        const probes = await this.probes.find({ where: { isActive: true } });
        const now = new Date();
        for (const probe of probes) {
            for (const hour of PEAK_HOURS) {
                const speed = this.syntheticSpeed(hour, probe.id);
                const at = new Date(now);
                at.setHours(hour, (probe.id * 7) % 50, 0, 0);
                await this.samples.save(this.samples.create({
                    probeId: probe.id,
                    currentSpeed: speed.current,
                    freeFlowSpeed: speed.freeFlow,
                    travelTimeSec: Math.round((0.4 / Math.max(speed.current, 1)) * 3600),
                    confidence: speed.confidence,
                    roadClosure: false,
                    source: 'survey_fallback',
                    sampledAt: at,
                }));
            }
        }
        return { seeded: true, samples: probes.length * PEAK_HOURS.length };
    }

    private async canCallTomTom() {
        const row = await this.quotaRow();
        return row.used < row.monthlyLimit * 0.9 && Boolean(process.env.TOMTOM_API_KEY);
    }

    private async callTomTom(lat: number, lon: number) {
        const key = process.env.TOMTOM_API_KEY;
        const url = `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?point=${lat},${lon}&unit=KMPH&key=${encodeURIComponent(key!)}`;
        const res = await fetch(url);
        const row = await this.quotaRow();
        row.used += 1;
        await this.quota.save(row);
        if (!res.ok) return null;
        const data = (await res.json()) as {
            flowSegmentData?: {
                currentSpeed?: number;
                freeFlowSpeed?: number;
                currentTravelTime?: number;
                confidence?: number;
                roadClosure?: boolean;
            };
        };
        const flow = data.flowSegmentData;
        if (!flow || flow.currentSpeed == null || flow.freeFlowSpeed == null) return null;
        return flow;
    }

    async sampleNow() {
        const probes = await this.probes.find({ where: { isActive: true } });
        const quota = await this.quotaStatus();
        let live = 0;
        let fallback = 0;
        const hour = new Date().getHours();
        for (const probe of probes) {
            let current = 0;
            let freeFlow = 32;
            let travel = 40;
            let confidence = 0.55;
            let closure = false;
            let source = 'survey_fallback';
            if (!quota.stopped && process.env.TOMTOM_API_KEY) {
                const allowed = await this.canCallTomTom();
                if (!allowed) break;
                const flow = await this.callTomTom(probe.latitude, probe.longitude).catch(() => null);
                if (flow && (flow.confidence ?? 0) >= 0.4) {
                    current = flow.currentSpeed ?? 0;
                    freeFlow = flow.freeFlowSpeed ?? current;
                    travel = flow.currentTravelTime ?? travel;
                    confidence = flow.confidence ?? 0.8;
                    closure = Boolean(flow.roadClosure);
                    source = 'tomtom';
                    live++;
                }
            }
            if (source !== 'tomtom') {
                const speed = this.syntheticSpeed(hour, probe.id);
                current = speed.current;
                freeFlow = speed.freeFlow;
                confidence = speed.confidence;
                travel = Math.round((0.4 / Math.max(current, 1)) * 3600);
                fallback++;
            }
            await this.samples.save(this.samples.create({
                probeId: probe.id,
                currentSpeed: current,
                freeFlowSpeed: freeFlow,
                travelTimeSec: travel,
                confidence,
                roadClosure: closure,
                source,
            }));
        }
        if (process.env.TOMTOM_RETAIN_RAW === 'false') {
            const cutoff = new Date(Date.now() - 24 * 3600 * 1000);
            await this.samples.createQueryBuilder().delete().where('sampled_at < :cutoff', { cutoff }).execute();
        }
        await this.aggregate();
        return { live, fallback, quota: await this.quotaStatus() };
    }

    private async tick() {
        const now = new Date();
        const day = now.toISOString().slice(0, 10);
        if (now.getHours() === 2 && this.lastAggDay !== day) {
            this.lastAggDay = day;
            await this.aggregate();
        }
        if (!PEAK_HOURS.includes(now.getHours())) return;
        if (Date.now() - this.lastLiveAt < 15 * 60 * 1000) return;
        this.lastLiveAt = Date.now();
        if (process.env.TOMTOM_API_KEY) await this.sampleNow();
    }

    async aggregate() {
        const rows = await this.samples.find();
        const probes = await this.probes.find();
        const probeDay = new Map(probes.map((p) => [p.id, p]));
        const groups = new Map<string, number[]>();
        const free = new Map<string, number[]>();
        for (const row of rows) {
            const key = `${row.probeId}|${this.dayType(row.sampledAt)}|${row.sampledAt.getHours()}`;
            const list = groups.get(key) ?? [];
            list.push(Number(row.currentSpeed));
            groups.set(key, list);
            const frees = free.get(key) ?? [];
            frees.push(Number(row.freeFlowSpeed));
            free.set(key, frees);
        }
        let saved = 0;
        for (const [key, speeds] of groups) {
            const [probeId, dayType, hour] = key.split('|');
            if (!probeDay.has(Number(probeId))) continue;
            const sorted = [...speeds].sort((a, b) => a - b);
            const median = sorted[Math.floor(sorted.length / 2)] ?? 0;
            const freeAvg = (free.get(key) ?? [median]).reduce((s, n) => s + n, 0) / Math.max(free.get(key)?.length ?? 1, 1);
            const factor = freeAvg > 0 ? Math.min(2.5, Math.max(0.2, median / freeAvg)) : 1;
            const existing = await this.profiles.findOne({
                where: { probeId: Number(probeId), dayType, hourBucket: Number(hour) },
            });
            if (existing) {
                existing.medianSpeed = median;
                existing.congestionFactor = factor;
                existing.sampleCount = speeds.length;
                await this.profiles.save(existing);
            } else {
                await this.profiles.save(this.profiles.create({
                    probeId: Number(probeId),
                    dayType,
                    hourBucket: Number(hour),
                    medianSpeed: median,
                    congestionFactor: factor,
                    sampleCount: speeds.length,
                }));
            }
            saved++;
        }
        return { profiles: saved };
    }

    async currentFactor(date = new Date()) {
        const rows = await this.profiles.find({
            where: { dayType: this.dayType(date), hourBucket: date.getHours() },
        });
        const pool = rows.length ? rows : await this.profiles.find({ where: { dayType: this.dayType(date), hourBucket: 8 } });
        if (!pool.length) return 1;
        const avg = pool.reduce((s, r) => s + Number(r.congestionFactor), 0) / pool.length;
        return avg > 0 ? 1 / avg : 1;
    }

    async layers() {
        const probes = await this.probes.find({ where: { isActive: true } });
        const now = new Date();
        const profiles = await this.profiles.find({ where: { dayType: this.dayType(now) } });
        const features = probes.map((probe) => {
            const match = profiles.find((p) => p.probeId === probe.id && p.hourBucket === (PEAK_HOURS.includes(now.getHours()) ? now.getHours() : 8))
                ?? profiles.find((p) => p.probeId === probe.id);
            const factor = match ? Number(match.congestionFactor) : 1;
            const dLon = 0.0012;
            return {
                type: 'Feature' as const,
                geometry: {
                    type: 'LineString' as const,
                    coordinates: [
                        [probe.longitude - dLon, probe.latitude],
                        [probe.longitude + dLon, probe.latitude],
                    ],
                },
                properties: {
                    name: probe.name,
                    ward: probe.ward,
                    factor,
                    speed: match?.medianSpeed ?? null,
                    color: factor < 0.55 ? '#c2410c' : factor < 0.8 ? '#d97706' : '#15803d',
                },
            };
        });
        return { type: 'FeatureCollection' as const, features, quota: await this.quotaStatus() };
    }

    async wards() {
        const probes = await this.probes.find();
        const layers = await this.layers();
        return WARDS.map((ward) => {
            const ids = new Set(probes.filter((p) => p.ward === ward.ward).map((p) => p.id));
            const feats = layers.features.filter((f) => ids.size && probes.some((p) => p.ward === ward.ward && p.name === f.properties.name));
            const factor = feats.length
                ? feats.reduce((s, f) => s + Number(f.properties.factor), 0) / feats.length
                : 1;
            return {
                ward: ward.ward,
                segments: feats.length,
                congestionFactor: Math.round(factor * 100) / 100,
                level: factor < 0.55 ? 'Cao' : factor < 0.8 ? 'Trung bình' : 'Thấp',
                speedKmh: feats.length ? Math.round(feats.reduce((s, f) => s + Number(f.properties.speed ?? 0), 0) / feats.length) : null,
            };
        });
    }
}
