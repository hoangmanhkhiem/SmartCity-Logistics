import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import {
    DeliveryEvent,
    Facility,
    HubCapacitySnapshot,
    Organization,
    ScenarioFeedback,
    SegmentDeliveryFlow,
    ShipmentLeg,
    SimOrder,
    SimScenario,
    Vehicle,
    WardWeight,
    Zone,
} from '../../../db/entities';
import { HIGH_DENSITY_WARDS, mulberry32, VEHICLE_TEMPLATES } from './hub-layout';
import { OsrmClient, type OsrmProfile } from './osrm.client';

const CARGO = ['parcel', 'grocery', 'document', 'food', 'pharma'];

@Injectable()
export class SimulationService {
    constructor(
        @InjectRepository(SimScenario) private readonly scenarios: Repository<SimScenario>,
        @InjectRepository(SimOrder) private readonly orders: Repository<SimOrder>,
        @InjectRepository(ShipmentLeg) private readonly legs: Repository<ShipmentLeg>,
        @InjectRepository(DeliveryEvent) private readonly events: Repository<DeliveryEvent>,
        @InjectRepository(Facility) private readonly facilities: Repository<Facility>,
        @InjectRepository(Organization) private readonly orgs: Repository<Organization>,
        @InjectRepository(Zone) private readonly zones: Repository<Zone>,
        @InjectRepository(Vehicle) private readonly vehicles: Repository<Vehicle>,
        @InjectRepository(HubCapacitySnapshot) private readonly snapshots: Repository<HubCapacitySnapshot>,
        @InjectRepository(WardWeight) private readonly wardWeights: Repository<WardWeight>,
        @InjectRepository(SegmentDeliveryFlow) private readonly flows: Repository<SegmentDeliveryFlow>,
        @InjectRepository(ScenarioFeedback) private readonly feedback: Repository<ScenarioFeedback>,
        private readonly osrm: OsrmClient,
    ) {}

    listScenarios() {
        return this.scenarios.find({ order: { id: 'DESC' } });
    }

    async getScenario(id: number) {
        const s = await this.scenarios.findOneBy({ id });
        if (!s) throw new NotFoundException('Kịch bản không tồn tại');
        const [orderCount, kpis] = await Promise.all([
            this.orders.count({ where: { scenarioId: id } }),
            Promise.resolve(s.kpis),
        ]);
        return { ...s, generatedOrders: orderCount, kpis };
    }

    async createScenario(body: { name?: string; seed?: number; orderCount?: number; lezMode?: string }) {
        const row = this.scenarios.create({
            name: body.name || 'Ngày giả lập 1.000 đơn',
            seed: body.seed ?? 20251125,
            orderCount: body.orderCount ?? 1000,
            lezMode: body.lezMode || 'none',
            status: 'draft',
            dataSource: 'SIMULATED',
            sourceName: 'Bộ sinh đơn FR23',
            sourceDate: '2026-11-25',
        });
        return this.scenarios.save(row);
    }

    async generate(id: number, _opts?: { useOsrm?: boolean }) {
        const scenario = await this.getScenario(id);
        await this.orders.delete({ scenarioId: id });
        await this.flows.delete({ scenarioId: id });

        const hubs = await this.facilities.find({
            where: { hubTier: In(['CENTRAL', 'MINI']), isActive: true },
            relations: ['organization', 'zone'],
        });
        const centrals = hubs.filter((h) => h.hubTier === 'CENTRAL');
        const minis = hubs.filter((h) => h.hubTier === 'MINI');
        if (centrals.length < 3 || minis.length < 8) {
            throw new BadRequestException('Chưa đủ mạng lưới hub 2 cấp. Chạy seed trước.');
        }

        const orgs = [...new Set(centrals.map((c) => c.organizationId))];
        const byOrg = (orgId: number) => ({
            central: centrals.find((c) => c.organizationId === orgId)!,
            minis: minis.filter((m) => m.organizationId === orgId),
        });

        let weights = await this.wardWeights.find({ where: [{ scenarioId: id }, { scenarioId: IsNull() }], relations: ['ward'] });
        if (!weights.length) {
            const zones = await this.zones.find({ where: { isActive: true } });
            weights = zones
                .filter((z) => z.type === 'district' || z.type === 'ward')
                .map((z) =>
                    this.wardWeights.create({
                        scenarioId: null,
                        wardId: z.id,
                        ward: z,
                        weight: HIGH_DENSITY_WARDS.includes(z.name) ? 2.5 : 1,
                        densityClass: HIGH_DENSITY_WARDS.includes(z.name) ? 'high' : 'normal',
                    }),
                );
        }
        const high = weights.filter((w) => w.densityClass === 'high' && w.ward);
        const normal = weights.filter((w) => w.densityClass !== 'high' && w.ward);
        const rand = mulberry32(scenario.seed);
        const n = scenario.orderCount;
        const split = [Math.floor(n / 3), Math.floor(n / 3), n - 2 * Math.floor(n / 3)];
        const orgCycle = orgs.flatMap((orgId, i) => Array.from({ length: split[i] ?? 0 }, () => orgId));

        const day = new Date('2026-11-25T00:00:00+07:00');
        const orders: SimOrder[] = [];
        for (let i = 0; i < n; i++) {
            const orgId = orgCycle[i];
            const net = byOrg(orgId);
            const highSlot = i < Math.round(n * 0.25);
            const pool = (highSlot ? high : normal).length ? (highSlot ? high : normal) : weights;
            const w = pool[Math.floor(rand() * pool.length)];
            const destMinis = net.minis.filter((m) => m.zoneId === w.wardId || m.wardId === w.wardId);
            const destHub = destMinis.length ? destMinis[Math.floor(rand() * destMinis.length)] : net.minis[Math.floor(rand() * net.minis.length)];
            const pickup = net.minis[Math.floor(rand() * net.minis.length)];
            const hour = 8 + Math.floor(rand() * 9);
            const minute = Math.floor(rand() * 60);
            const created = new Date(day);
            created.setHours(hour, minute, 0, 0);
            const jitter = (rand() - 0.5) * 0.012;
            orders.push(
                this.orders.create({
                    scenarioId: id,
                    organizationId: orgId,
                    pickupHubId: pickup.id,
                    destHubId: destHub.id,
                    wardId: w.wardId,
                    destLat: destHub.latitude + jitter,
                    destLon: destHub.longitude + (rand() - 0.5) * 0.012,
                    weightKg: Math.round((0.4 + rand() * 12) * 10) / 10,
                    volumeM3: Math.round((0.002 + rand() * 0.06) * 1000) / 1000,
                    cargoType: CARGO[Math.floor(rand() * CARGO.length)],
                    packageCount: 1 + Math.floor(rand() * 4),
                    createdAtSim: created,
                    dataSource: 'SIMULATED',
                }),
            );
        }
        await this.orders.save(orders, { chunk: 200 });

        const saved = await this.orders.find({ where: { scenarioId: id } });
        await this.buildLegsAndEvents(scenario, saved, byOrg, _opts?.useOsrm === true);
        const kpis = await this.computeKpis(id);
        await this.scenarios.update(id, { status: 'ready', kpis });
        return this.getScenario(id);
    }

    private async buildLegsAndEvents(
        scenario: SimScenario,
        orders: SimOrder[],
        byOrg: (orgId: number) => { central: Facility; minis: Facility[] },
        _useOsrm: boolean,
    ) {
        const fleet = await this.vehicles.find({ where: { isActive: true } });
        const legs: ShipmentLeg[] = [];
        const events: DeliveryEvent[] = [];
        const usedKg = new Map<number, number>();
        const usedM3 = new Map<number, number>();
        const flow = new Map<string, { count: number; geom: [number, number][] }>();

        const bump = (hubId: number | null | undefined, kg: number, m3: number) => {
            if (!hubId) return;
            usedKg.set(hubId, (usedKg.get(hubId) ?? 0) + kg);
            usedM3.set(hubId, (usedM3.get(hubId) ?? 0) + m3);
        };

        for (const o of orders) {
            const net = byOrg(o.organizationId);
            const pickup = net.minis.find((m) => m.id === o.pickupHubId) ?? net.minis[0];
            const dest = net.minis.find((m) => m.id === o.destHubId) ?? net.minis[0];
            const hour = o.createdAtSim.getHours();
            const trunk = this.pickVehicle(fleet, net.central.organizationId, o.weightKg, 'van');
            const last = this.pickVehicle(fleet, net.central.organizationId, o.weightKg, 'ebike');

            const hops: Array<{
                no: number;
                from: Facility | null;
                to: Facility | null;
                end: [number, number];
                start: [number, number];
                type: string;
                event: string;
                profile: OsrmProfile;
            }> = [
                {
                    no: 1,
                    from: pickup,
                    to: net.central,
                    start: [pickup.longitude, pickup.latitude],
                    end: [net.central.longitude, net.central.latitude],
                    type: trunk?.type || 'van',
                    event: 'pickup_mini',
                    profile: 'driving',
                },
                {
                    no: 2,
                    from: net.central,
                    to: dest,
                    start: [net.central.longitude, net.central.latitude],
                    end: [dest.longitude, dest.latitude],
                    type: trunk?.type || 'van',
                    event: 'central_out',
                    profile: 'driving',
                },
                {
                    no: 3,
                    from: dest,
                    to: null,
                    start: [dest.longitude, dest.latitude],
                    end: [o.destLon, o.destLat],
                    type: last?.type || 'ebike',
                    event: 'last_mile',
                    profile: 'bike',
                },
            ];

            bump(pickup.id, o.weightKg, o.volumeM3);
            bump(net.central.id, o.weightKg, o.volumeM3);
            bump(dest.id, o.weightKg, o.volumeM3);

            for (const hop of hops) {
                const routed = await this.osrm.route(hop.start, hop.end, hop.profile);
                const tpl = VEHICLE_TEMPLATES.find((t) => t.type === hop.type) ?? VEHICLE_TEMPLATES[3];
                const v = hop.no < 3 ? trunk : last;
                const co2 = routed.distanceKm * (v?.co2GPerKm ?? v?.emissionFactor ?? tpl.co2GPerKm);
                legs.push(
                    this.legs.create({
                        orderId: o.id,
                        legNo: hop.no,
                        fromHubId: hop.from?.id ?? null,
                        toHubId: hop.to?.id ?? null,
                        vehicleId: v?.id ?? null,
                        vehicleType: hop.type,
                        routeGeom: JSON.stringify({ type: 'LineString', coordinates: routed.coordinates }),
                        distanceKm: Math.round(routed.distanceKm * 100) / 100,
                        durationMin: Math.round(routed.durationMin * 10) / 10,
                        co2G: Math.round(co2),
                        hourBucket: hour,
                    }),
                );
                events.push(
                    this.events.create({
                        orderId: o.id,
                        eventType: hop.event,
                        hubId: hop.from?.id ?? hop.to?.id ?? null,
                        occurredAt: o.createdAtSim,
                        shareLevel: 'industry',
                    }),
                );
                this.addFlow(flow, scenario.id, hour, routed.coordinates);
            }
            events.push(
                this.events.create({
                    orderId: o.id,
                    eventType: 'delivered',
                    hubId: dest.id,
                    occurredAt: new Date(o.createdAtSim.getTime() + 90 * 60 * 1000),
                    shareLevel: 'industry',
                }),
            );
        }

        await this.legs.save(legs, { chunk: 300 });
        await this.events.save(events, { chunk: 300 });

        const snapAt = new Date();
        const snaps = [...usedKg.entries()].map(([hubId, kg]) =>
            this.snapshots.create({
                hubId,
                usedKg: Math.round(kg * 10) / 10,
                usedM3: Math.round((usedM3.get(hubId) ?? 0) * 1000) / 1000,
                shareLevel: 'industry',
                recordedAt: snapAt,
            }),
        );
        if (snaps.length) await this.snapshots.save(snaps, { chunk: 100 });

        const flowRows = [...flow.entries()].map(([key, v]) => {
            const [, hour, segmentId] = key.split('|');
            return this.flows.create({
                scenarioId: scenario.id,
                segmentId,
                hour: Number(hour),
                vehicleCount: v.count,
                geometry: JSON.stringify({ type: 'LineString', coordinates: v.geom }),
            });
        });
        if (flowRows.length) await this.flows.save(flowRows, { chunk: 200 });
    }

    private pickVehicle(fleet: Vehicle[], orgHint: number, kg: number, prefer: string) {
        const typed = fleet.filter((v) => v.type === prefer || (prefer === 'ebike' && v.type.includes('bike')));
        const pool = typed.length ? typed : fleet;
        const fit = pool.filter((v) => (v.payloadKg ?? v.capacity ?? 50) >= kg);
        return (fit.length ? fit : pool)[Math.abs(orgHint + Math.round(kg)) % Math.max(1, (fit.length ? fit : pool).length)];
    }

    private addFlow(
        flow: Map<string, { count: number; geom: [number, number][] }>,
        scenarioId: number,
        hour: number,
        coords: [number, number][],
    ) {
        if (coords.length < 2) return;
        const a = coords[0];
        const b = coords[coords.length - 1];
        const q = (n: number) => Math.round(n * 80) / 80;
        const segmentId = `${q(a[0])},${q(a[1])}-${q(b[0])},${q(b[1])}`;
        const key = `${scenarioId}|${hour}|${segmentId}`;
        const cur = flow.get(key);
        if (cur) cur.count += 1;
        else flow.set(key, { count: 1, geom: [a, b] });
    }

    async computeKpis(scenarioId: number) {
        const raw = await this.legs
            .createQueryBuilder('l')
            .innerJoin(SimOrder, 'o', 'o.id = l.order_id')
            .select('SUM(l.distance_km)', 'km')
            .addSelect('SUM(l.duration_min)', 'min')
            .addSelect('SUM(l.co2_g)', 'co2')
            .addSelect('COUNT(DISTINCT o.id)', 'orders')
            .where('o.scenario_id = :scenarioId', { scenarioId })
            .getRawOne<{ km: string; min: string; co2: string; orders: string }>();
        return {
            totalKm: Number(raw?.km ?? 0),
            durationMin: Number(raw?.min ?? 0),
            co2G: Number(raw?.co2 ?? 0),
            orders: Number(raw?.orders ?? 0),
        };
    }

    async publish(id: number) {
        const s = await this.getScenario(id);
        if (s.status === 'draft') throw new BadRequestException('Cần sinh đơn trước khi công bố');
        await this.scenarios.update(id, { status: 'published', publishedAt: new Date() });
        return this.getScenario(id);
    }

    async listOrders(scenarioId: number, page = 1, limit = 10, orgId?: number) {
        const where = { scenarioId, ...(orgId ? { organizationId: orgId } : {}) };
        const [data, total] = await this.orders.findAndCount({
            where,
            relations: ['organization', 'pickupHub', 'destHub', 'ward'],
            order: { id: 'ASC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return {
            data: data.map((o) => this.publicOrder(o)),
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }

    async getOrder(id: number) {
        const o = await this.orders.findOne({
            where: { id },
            relations: ['organization', 'pickupHub', 'destHub', 'ward'],
        });
        if (!o) throw new NotFoundException('Đơn không tồn tại');
        const legs = await this.legs.find({ where: { orderId: id }, order: { legNo: 'ASC' }, relations: ['fromHub', 'toHub'] });
        const events = await this.events.find({ where: { orderId: id }, order: { occurredAt: 'ASC' }, relations: ['hub'] });
        return { order: this.publicOrder(o), legs, events: events.map((e) => this.publicEvent(e)) };
    }

    /** Gọi chỉ đường thật (OSRM/Mapbox) cho 3 chặng — không trả đường chim bay. */
    async liveRoute(orderId: number) {
        const o = await this.orders.findOne({ where: { id: orderId } });
        if (!o) throw new NotFoundException('Đơn không tồn tại');
        const legs = await this.legs.find({
            where: { orderId },
            order: { legNo: 'ASC' },
            relations: ['fromHub', 'toHub'],
        });
        if (!legs.length) throw new BadRequestException('Đơn chưa có chặng lộ trình');

        for (const leg of legs) {
            const from = leg.fromHub;
            const to = leg.toHub;
            if (!from) continue;
            const start: [number, number] = [from.longitude, from.latitude];
            const end: [number, number] = to
                ? [to.longitude, to.latitude]
                : [o.destLon, o.destLat];
            const bike = (leg.vehicleType || '').includes('bike') || leg.legNo === 3;
            try {
                const routed = await this.osrm.route(start, end, bike ? 'bike' : 'driving', true);
                const tpl = VEHICLE_TEMPLATES.find((t) => t.type === (leg.vehicleType || (bike ? 'ebike' : 'van'))) ?? VEHICLE_TEMPLATES[3];
                await this.legs.update(leg.id, {
                    routeGeom: JSON.stringify({ type: 'LineString', coordinates: routed.coordinates }),
                    distanceKm: Math.round(routed.distanceKm * 100) / 100,
                    durationMin: Math.round(routed.durationMin * 10) / 10,
                    co2G: Math.round(routed.distanceKm * tpl.co2GPerKm),
                });
            } catch (err) {
                throw new BadRequestException(err instanceof Error ? err.message : 'Không chỉ đường được');
            }
        }
        return this.getOrder(orderId);
    }

    async history(params: { page?: number; limit?: number; orgId?: number; scenarioId?: number }) {
        const page = params.page ?? 1;
        const limit = params.limit ?? 10;
        const qb = this.events
            .createQueryBuilder('e')
            .leftJoinAndSelect('e.order', 'o')
            .leftJoinAndSelect('o.organization', 'org')
            .leftJoinAndSelect('e.hub', 'hub')
            .leftJoinAndSelect('o.ward', 'ward')
            .orderBy('e.occurred_at', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);
        if (params.orgId) qb.andWhere('o.organization_id = :orgId', { orgId: params.orgId });
        if (params.scenarioId) qb.andWhere('o.scenario_id = :sid', { sid: params.scenarioId });
        const [rows, total] = await qb.getManyAndCount();
        return {
            data: rows.map((e) => this.publicEvent(e)),
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }

    async hubNetwork(orgId?: number) {
        const hubs = await this.facilities.find({
            where: {
                isActive: true,
                ...(orgId ? { organizationId: orgId } : {}),
            },
            relations: ['organization', 'zone', 'parentHub'],
            order: { hubTier: 'ASC', name: 'ASC' },
        });
        const filtered = hubs.filter((h) => h.hubTier === 'CENTRAL' || h.hubTier === 'MINI' || h.hubTier === 'TRANSFER');
        const latest = await this.snapshots.find({ order: { recordedAt: 'DESC' }, take: 400 });
        const byHub = new Map<number, HubCapacitySnapshot>();
        for (const s of latest) if (!byHub.has(s.hubId)) byHub.set(s.hubId, s);
        const links = filtered
            .filter((h) => h.hubTier === 'MINI' && h.parentHub)
            .map((h) => ({
                type: 'Feature' as const,
                geometry: {
                    type: 'LineString' as const,
                    coordinates: [
                        [h.longitude, h.latitude],
                        [h.parentHub!.longitude, h.parentHub!.latitude],
                    ],
                },
                properties: { orgId: h.organizationId, color: '#6366f1' },
            }));
        return {
            hubs: filtered.map((h) => {
                const snap = byHub.get(h.id);
                const capKg = h.capacityKg ?? (h.hubTier === 'CENTRAL' ? 1_000_000 : 1500);
                const capM3 = h.capacityM3 ?? (h.hubTier === 'CENTRAL' ? 4000 : 8);
                const usedKg = snap?.usedKg ?? 0;
                const usedM3 = snap?.usedM3 ?? 0;
                return {
                    id: h.id,
                    name: h.name,
                    hubTier: h.hubTier,
                    organizationId: h.organizationId,
                    organizationName: h.organization?.name,
                    zoneName: h.zone?.name,
                    latitude: h.latitude,
                    longitude: h.longitude,
                    address: h.address,
                    openingTime: h.openingTime,
                    closingTime: h.closingTime,
                    parentHubId: h.parentHubId,
                    dataSource: h.dataSource,
                    capacityKg: capKg,
                    capacityM3: capM3,
                    usedKg,
                    usedM3,
                    freeKg: Math.max(0, capKg - usedKg),
                    freeM3: Math.max(0, capM3 - usedM3),
                    recordedAt: snap?.recordedAt ?? null,
                };
            }),
            links: { type: 'FeatureCollection', features: links },
        };
    }

    async updateCapacity(hubId: number, body: { usedKg?: number; usedM3?: number; shareLevel?: string }) {
        const hub = await this.facilities.findOneBy({ id: hubId });
        if (!hub) throw new NotFoundException('Hub không tồn tại');
        const row = this.snapshots.create({
            hubId,
            usedKg: body.usedKg ?? 0,
            usedM3: body.usedM3 ?? 0,
            shareLevel: body.shareLevel || 'industry',
            recordedAt: new Date(),
        });
        return this.snapshots.save(row);
    }

    async flowGeoJson(scenarioId: number, hour?: number) {
        const where = hour != null ? { scenarioId, hour } : { scenarioId };
        const rows = await this.flows.find({ where });
        const max = Math.max(1, ...rows.map((r) => r.vehicleCount));
        return {
            type: 'FeatureCollection',
            features: rows.map((r) => {
                let geom: GeoJSON.LineString = { type: 'LineString', coordinates: [] };
                try {
                    geom = JSON.parse(r.geometry || 'null') ?? geom;
                } catch {
                    /* keep empty */
                }
                const t = r.vehicleCount / max;
                const color = t > 0.7 ? '#b91c1c' : t > 0.4 ? '#ea580c' : '#2563eb';
                return {
                    type: 'Feature',
                    geometry: geom,
                    properties: {
                        segmentId: r.segmentId,
                        hour: r.hour,
                        vehicleCount: r.vehicleCount,
                        alert: r.vehicleCount >= 40,
                        color,
                        weight: 0.3 + t * 0.7,
                    },
                };
            }),
        };
    }

    async addFeedback(body: {
        scenarioId: number;
        userId?: number;
        stance?: string;
        content?: string;
        latitude?: number;
        longitude?: number;
    }) {
        const scenario = await this.scenarios.findOneBy({ id: body.scenarioId });
        if (!scenario) throw new NotFoundException('Kịch bản không tồn tại');
        return this.feedback.save(
            this.feedback.create({
                scenarioId: body.scenarioId,
                userId: body.userId ?? null,
                stance: body.stance || 'neutral',
                content: body.content ?? null,
                latitude: body.latitude ?? null,
                longitude: body.longitude ?? null,
                status: 'new',
            }),
        );
    }

    listFeedback(scenarioId?: number) {
        return this.feedback.find({
            where: scenarioId ? { scenarioId } : {},
            relations: ['user', 'scenario'],
            order: { createdAt: 'DESC' },
            take: 100,
        });
    }

    async replyFeedback(id: number, reply: string, status = 'answered') {
        await this.feedback.update(id, { reply, status });
        return this.feedback.findOne({ where: { id }, relations: ['user', 'scenario'] });
    }

    publishedScenarios() {
        return this.scenarios.find({ where: { status: 'published' }, order: { publishedAt: 'DESC' } });
    }

    /** Một đơn mẫu: MiniHub Cầu Giấy → Hub tổng Mê Linh → MiniHub Thanh Xuân. */
    async demoTrip() {
        const pickup = await this.facilities.findOne({ where: { name: 'MiniHub Cầu Giấy 1 · DN A' } });
        const dest = await this.facilities.findOne({ where: { name: 'MiniHub Thanh Xuân · DN A' } });
        const central = await this.facilities.findOne({ where: { name: 'Hub tổng Mê Linh' } });
        if (!pickup || !dest || !central) {
            throw new BadRequestException('Chưa có mạng lưới hub 2 cấp. Chạy db:seed trước.');
        }

        const existing = await this.orders.findOne({
            where: { cargoType: 'demo-3-leg' },
            order: { id: 'DESC' },
        });
        if (existing) {
            await this.rerouteDemoOrder(existing.id, pickup, dest, central);
            return this.getOrder(existing.id);
        }

        let scenario = await this.scenarios.findOne({ where: { lezMode: 'none' }, order: { id: 'ASC' } });
        if (!scenario) {
            scenario = await this.createScenario({
                name: 'Đơn mẫu 3 chặng',
                seed: 20251125,
                orderCount: 1,
                lezMode: 'none',
            });
        }

        const createdAtSim = new Date('2026-11-25T09:15:00+07:00');
        const destLat = dest.latitude + 0.004;
        const destLon = dest.longitude + 0.003;
        const order = await this.orders.save(
            this.orders.create({
                scenarioId: scenario.id,
                organizationId: pickup.organizationId,
                pickupHubId: pickup.id,
                destHubId: dest.id,
                wardId: dest.zoneId ?? dest.wardId,
                destLat,
                destLon,
                weightKg: 8.5,
                volumeM3: 0.04,
                cargoType: 'demo-3-leg',
                packageCount: 2,
                createdAtSim,
                dataSource: 'SIMULATED',
            }),
        );

        const hops: Array<{
            no: number;
            from: Facility | null;
            to: Facility | null;
            start: [number, number];
            end: [number, number];
            type: string;
            event: string;
            profile: OsrmProfile;
        }> = [
            {
                no: 1,
                from: pickup,
                to: central,
                start: [pickup.longitude, pickup.latitude],
                end: [central.longitude, central.latitude],
                type: 'van',
                event: 'pickup_mini',
                profile: 'driving',
            },
            {
                no: 2,
                from: central,
                to: dest,
                start: [central.longitude, central.latitude],
                end: [dest.longitude, dest.latitude],
                type: 'van',
                event: 'central_out',
                profile: 'driving',
            },
            {
                no: 3,
                from: dest,
                to: null,
                start: [dest.longitude, dest.latitude],
                end: [destLon, destLat],
                type: 'ebike',
                event: 'last_mile',
                profile: 'bike',
            },
        ];

        const legs: ShipmentLeg[] = [];
        const events: DeliveryEvent[] = [];
        for (const hop of hops) {
            let routed;
            try {
                routed = await this.osrm.route(hop.start, hop.end, hop.profile, true);
            } catch (err) {
                throw new BadRequestException(err instanceof Error ? err.message : 'Không chỉ đường được');
            }
            const tpl = VEHICLE_TEMPLATES.find((t) => t.type === hop.type) ?? VEHICLE_TEMPLATES[3];
            legs.push(
                this.legs.create({
                    orderId: order.id,
                    legNo: hop.no,
                    fromHubId: hop.from?.id ?? null,
                    toHubId: hop.to?.id ?? null,
                    vehicleType: hop.type,
                    routeGeom: JSON.stringify({ type: 'LineString', coordinates: routed.coordinates }),
                    distanceKm: Math.round(routed.distanceKm * 100) / 100,
                    durationMin: Math.round(routed.durationMin * 10) / 10,
                    co2G: Math.round(routed.distanceKm * tpl.co2GPerKm),
                    hourBucket: 9,
                }),
            );
            events.push(
                this.events.create({
                    orderId: order.id,
                    eventType: hop.event,
                    hubId: hop.from?.id ?? hop.to?.id ?? null,
                    occurredAt: new Date(createdAtSim.getTime() + (hop.no - 1) * 50 * 60 * 1000),
                    shareLevel: 'industry',
                }),
            );
        }
        events.push(
            this.events.create({
                orderId: order.id,
                eventType: 'delivered',
                hubId: dest.id,
                occurredAt: new Date(createdAtSim.getTime() + 3 * 50 * 60 * 1000),
                shareLevel: 'industry',
            }),
        );
        await this.legs.save(legs);
        await this.events.save(events);
        return this.getOrder(order.id);
    }

    private async rerouteDemoOrder(orderId: number, pickup: Facility, dest: Facility, central: Facility) {
        const order = await this.orders.findOneBy({ id: orderId });
        if (!order) return;
        const hops: Array<{ id?: number; start: [number, number]; end: [number, number]; profile: OsrmProfile; type: string }> = [];
        const saved = await this.legs.find({ where: { orderId }, order: { legNo: 'ASC' } });
        hops.push({
            id: saved[0]?.id,
            start: [pickup.longitude, pickup.latitude],
            end: [central.longitude, central.latitude],
            profile: 'driving',
            type: 'van',
        });
        hops.push({
            id: saved[1]?.id,
            start: [central.longitude, central.latitude],
            end: [dest.longitude, dest.latitude],
            profile: 'driving',
            type: 'van',
        });
        hops.push({
            id: saved[2]?.id,
            start: [dest.longitude, dest.latitude],
            end: [order.destLon, order.destLat],
            profile: 'bike',
            type: 'ebike',
        });
        for (let i = 0; i < hops.length; i++) {
            const hop = hops[i];
            let routed;
            try {
                routed = await this.osrm.route(hop.start, hop.end, hop.profile, true);
            } catch (err) {
                throw new BadRequestException(err instanceof Error ? err.message : 'Không chỉ đường được');
            }
            const tpl = VEHICLE_TEMPLATES.find((t) => t.type === hop.type) ?? VEHICLE_TEMPLATES[3];
            const patch = {
                routeGeom: JSON.stringify({ type: 'LineString', coordinates: routed.coordinates }),
                distanceKm: Math.round(routed.distanceKm * 100) / 100,
                durationMin: Math.round(routed.durationMin * 10) / 10,
                co2G: Math.round(routed.distanceKm * tpl.co2GPerKm),
            };
            if (hop.id) await this.legs.update(hop.id, patch);
        }
    }

    private publicOrder(o: SimOrder) {
        return {
            id: o.id,
            scenarioId: o.scenarioId,
            organizationId: o.organizationId,
            organizationName: o.organization?.name,
            pickupHub: o.pickupHub
                ? { id: o.pickupHub.id, name: o.pickupHub.name, hubTier: o.pickupHub.hubTier, latitude: o.pickupHub.latitude, longitude: o.pickupHub.longitude }
                : null,
            destHub: o.destHub
                ? { id: o.destHub.id, name: o.destHub.name, hubTier: o.destHub.hubTier, latitude: o.destHub.latitude, longitude: o.destHub.longitude }
                : null,
            wardName: o.ward?.name ?? null,
            destLat: o.destLat,
            destLon: o.destLon,
            weightKg: o.weightKg,
            volumeM3: o.volumeM3,
            cargoType: o.cargoType,
            packageCount: o.packageCount,
            createdAtSim: o.createdAtSim,
            dataSource: o.dataSource,
        };
    }

    private publicEvent(e: DeliveryEvent) {
        const o = e.order;
        return {
            id: e.id,
            eventType: e.eventType,
            occurredAt: e.occurredAt,
            hubName: e.hub?.name ?? null,
            organizationName: o?.organization?.name ?? null,
            wardName: o?.ward?.name ?? null,
            cargoType: o?.cargoType ?? null,
            packageCount: o?.packageCount ?? null,
            weightKg: o?.weightKg ?? null,
            volumeM3: o?.volumeM3 ?? null,
            shareLevel: e.shareLevel,
        };
    }
}
