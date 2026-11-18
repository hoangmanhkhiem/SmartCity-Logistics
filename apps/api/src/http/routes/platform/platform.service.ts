import { createHash } from 'crypto';
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DemandAgg, EmissionFactor, IssueReport, JobRecord, Plan, Scenario } from '../../../db/entities/platform.entity';

const ISSUE_TYPE_ALIASES: Record<string, string> = {
    congestion: 'congestion',
    un_tac: 'congestion',
    'ùn tắc': 'congestion',
    'un tac': 'congestion',
    'tắc đường': 'congestion',
    'tac duong': 'congestion',
    long_jam: 'long_jam',
    'ùn tắc dài': 'long_jam',
    'un tac dai': 'long_jam',
    'tắc dài': 'long_jam',
    accident: 'accident',
    'tai nạn': 'accident',
    'tai nan': 'accident',
    parking: 'parking',
    'không chỗ dừng đỗ': 'parking',
    'khong cho dung do': 'parking',
    restriction: 'restriction',
    'cấm đường': 'restriction',
    'cam duong': 'restriction',
    'cấm đường / cấm giờ': 'restriction',
    flood: 'flood',
    'mưa / ngập': 'flood',
    'mưa': 'flood',
    'ngập': 'flood',
    alley: 'alley',
    'ngõ nhỏ, khó quay đầu': 'alley',
    map_error: 'map_error',
    'sai vị trí bản đồ': 'map_error',
    other: 'other',
};

export function normalizeIssueType(raw: string): string {
    const key = (raw || '').trim().toLowerCase();
    return ISSUE_TYPE_ALIASES[key] || (key.replace(/\s+/g, '_').slice(0, 32) || 'other');
}

function reporterHashFor(userId: number) {
    return createHash('sha256').update(String(userId)).digest('hex');
}

const LIVE_ISSUE_STATUSES = ['approved', 'clear_pending'] as const;

function issueToFeature(row: IssueReport) {
    const waitingClear = row.status === 'clear_pending';
    return {
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [row.longitude, row.latitude] as [number, number] },
        properties: {
            id: row.id,
            issueType: row.issueType,
            note: row.note,
            status: row.status,
            weight: row.issueType === 'accident' || row.issueType === 'long_jam' ? 1 : row.issueType === 'congestion' ? 0.9 : 0.65,
            color: waitingClear
                ? '#d97706'
                : row.issueType === 'accident'
                    ? '#7f1d1d'
                    : row.issueType === 'congestion' || row.issueType === 'long_jam'
                        ? '#dc2626'
                        : '#ea580c',
        },
    };
}

const DEFAULT_FACTORS: Array<[string, string, number]> = [
    ['motorbike_ice', 'gasoline', 72],
    ['motorbike_ev', 'electric', 18],
    ['ebike', 'electric', 8],
    ['van', 'diesel', 210],
    ['light_truck', 'diesel', 320],
];

@Injectable()
export class PlatformService {
    constructor(
        @InjectRepository(EmissionFactor) private readonly factors: Repository<EmissionFactor>,
        @InjectRepository(IssueReport) private readonly issues: Repository<IssueReport>,
        @InjectRepository(Plan) private readonly plans: Repository<Plan>,
        @InjectRepository(Scenario) private readonly scenarios: Repository<Scenario>,
        @InjectRepository(JobRecord) private readonly jobs: Repository<JobRecord>,
        @InjectRepository(DemandAgg) private readonly demand: Repository<DemandAgg>,
    ) {}

    async listFactors() {
        const n = await this.factors.count();
        if (n === 0) {
            await this.factors.save(
                DEFAULT_FACTORS.map(([vehicleType, fuelType, g]) =>
                    this.factors.create({ vehicleType, fuelType, gCo2ePerKm: g.toFixed(2), sourceRef: 'demo-factor' }),
                ),
            );
        }
        return this.factors.find({ order: { id: 'ASC' } });
    }

    createFactor(body: { vehicleType: string; fuelType: string; gCo2ePerKm: number; sourceRef?: string }) {
        return this.factors.save(this.factors.create({
            vehicleType: body.vehicleType,
            fuelType: body.fuelType,
            gCo2ePerKm: Number(body.gCo2ePerKm).toFixed(2),
            sourceRef: body.sourceRef ?? null,
        }));
    }

    async updateFactor(id: number, body: { vehicleType?: string; fuelType?: string; gCo2ePerKm?: number; sourceRef?: string }) {
        const row = await this.factors.findOne({ where: { id } });
        if (!row) throw new NotFoundException('Emission factor not found');
        if (body.vehicleType != null) row.vehicleType = body.vehicleType;
        if (body.fuelType != null) row.fuelType = body.fuelType;
        if (body.gCo2ePerKm != null) row.gCo2ePerKm = Number(body.gCo2ePerKm).toFixed(2);
        if (body.sourceRef !== undefined) row.sourceRef = body.sourceRef;
        return this.factors.save(row);
    }

    async deleteFactor(id: number) {
        const row = await this.factors.findOne({ where: { id } });
        if (!row) throw new NotFoundException('Emission factor not found');
        await this.factors.remove(row);
        return { deleted: true };
    }

    listIssues() {
        return this.issues.find({ order: { id: 'DESC' }, take: 200 });
    }

    listMyIssues(userId: number) {
        return this.issues.find({ where: { reporterHash: reporterHashFor(userId) }, order: { id: 'DESC' }, take: 50 });
    }

    async updateIssue(id: number, body: { issueType?: string; note?: string; status?: string }) {
        const row = await this.issues.findOne({ where: { id } });
        if (!row) throw new NotFoundException('Issue not found');
        if (body.issueType != null) row.issueType = body.issueType;
        if (body.note !== undefined) row.note = body.note;
        if (body.status != null) row.status = body.status;
        return this.issues.save(row);
    }

    async deleteIssue(id: number) {
        const row = await this.issues.findOne({ where: { id } });
        if (!row) throw new NotFoundException('Issue not found');
        await this.issues.remove(row);
        return { deleted: true };
    }

    listPlans() {
        return this.plans.find({ order: { id: 'DESC' }, take: 100 });
    }

    async updatePlan(id: number, body: { status?: string }) {
        const row = await this.plans.findOne({ where: { id } });
        if (!row) throw new NotFoundException('Plan not found');
        if (body.status != null) row.status = body.status;
        return this.plans.save(row);
    }

    async deletePlan(id: number) {
        const row = await this.plans.findOne({ where: { id } });
        if (!row) throw new NotFoundException('Plan not found');
        await this.plans.remove(row);
        return { deleted: true };
    }

    listScenarios() {
        return this.scenarios.find({ order: { id: 'DESC' }, take: 100 });
    }

    async updateScenario(id: number, body: { name?: string; kind?: string }) {
        const row = await this.scenarios.findOne({ where: { id } });
        if (!row) throw new NotFoundException('Scenario not found');
        if (body.name != null) row.name = body.name;
        if (body.kind != null) row.kind = body.kind;
        return this.scenarios.save(row);
    }

    async deleteScenario(id: number) {
        const row = await this.scenarios.findOne({ where: { id } });
        if (!row) throw new NotFoundException('Scenario not found');
        await this.scenarios.remove(row);
        return { deleted: true };
    }

    reportIssue(userId: number, body: { issueType: string; latitude: number; longitude: number; zoneId?: number; note?: string }) {
        const lat = Number(body.latitude);
        const lon = Number(body.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
            throw new BadRequestException('Vị trí báo cáo không hợp lệ');
        }
        const issueType = normalizeIssueType(body.issueType);
        const latitude = lat + (Math.random() - 0.5) * 0.00045;
        const longitude = lon + (Math.random() - 0.5) * 0.00045;
        return this.issues.save(
            this.issues.create({
                reporterHash: reporterHashFor(userId),
                issueType,
                latitude,
                longitude,
                zoneId: body.zoneId ?? null,
                note: body.note ?? null,
                status: 'new',
            }),
        );
    }

    async requestClear(id: number, _userId: number, note?: string) {
        const row = await this.issues.findOne({ where: { id } });
        if (!row) throw new NotFoundException('Issue not found');
        if (row.status === 'clear_pending') {
            throw new ConflictException('Điểm này đang chờ cơ quan xác nhận đã hết');
        }
        if (row.status !== 'approved') {
            throw new BadRequestException('Chỉ báo đã hết với điểm đang còn hiệu lực trên bản đồ');
        }
        row.status = 'clear_pending';
        const stamp = `Cộng đồng báo đã hết (${new Date().toISOString()})`;
        row.note = [row.note, note?.trim(), stamp].filter(Boolean).join(' · ');
        return this.issues.save(row);
    }

    async reviewIssue(id: number, status: 'approved' | 'rejected') {
        const row = await this.issues.findOne({ where: { id } });
        if (!row) throw new NotFoundException('Issue not found');
        if (row.status === 'cleared') {
            throw new BadRequestException('Báo cáo này đã đóng');
        }
        if (row.status === 'clear_pending') {
            // Duyệt = xác nhận đã hết; Loại = vẫn còn sự cố, giữ trên bản đồ.
            row.status = status === 'approved' ? 'cleared' : 'approved';
            return this.issues.save(row);
        }
        row.status = status;
        return this.issues.save(row);
    }

    async bottlenecks(issueType?: string) {
        const qb = this.issues.createQueryBuilder('i').where('i.status IN (:...s)', { s: [...LIVE_ISSUE_STATUSES] });
        if (issueType) qb.andWhere('i.issue_type = :t', { t: normalizeIssueType(issueType) });
        const rows = await qb.orderBy('i.id', 'DESC').take(400).getMany();
        const geojson = { type: 'FeatureCollection' as const, features: rows.map(issueToFeature) };
        return { gridM: 250, count: rows.length, items: rows, geojson };
    }

    async approvedIncidentPoints() {
        const rows = await this.issues.find({
            where: LIVE_ISSUE_STATUSES.map((status) => ({ status })),
            order: { id: 'DESC' },
            take: 400,
        });
        return rows
            .filter((r) => Number.isFinite(r.latitude) && Number.isFinite(r.longitude))
            .map((r) => ({
                id: r.id,
                issueType: r.issueType,
                lat: r.latitude,
                lon: r.longitude,
            }));
    }

    async createPlan(organizationId: number | null, params: Record<string, unknown>) {
        const started = Date.now();
        const plan = await this.plans.save(
            this.plans.create({
                organizationId,
                solverParams: params,
                status: 'done',
                runtimeMs: Date.now() - started,
                objectiveValue: Number(params.orderCount ?? 0),
                result: {
                    note: 'Kế hoạch demo: ràng buộc LEZ/cấm giờ được ghi nhận. Solver OR-Tools gắn ở worker khi có dịch vụ optimizer.',
                    stops: [],
                },
            }),
        );
        const job = await this.jobs.save(this.jobs.create({ type: 'plan', status: 'done', result: { planId: plan.id } }));
        return { jobId: job.id, planId: plan.id };
    }

    getPlan(id: number) {
        return this.plans.findOne({ where: { id } }).then((p) => {
            if (!p) throw new NotFoundException('Plan not found');
            return p;
        });
    }

    async createScenario(name: string, kind: string, changes: Record<string, unknown>) {
        const row = await this.scenarios.save(
            this.scenarios.create({
                name,
                kind,
                changes,
                kpis: { km: null, emptyKm: null, co2eG: null, onTimeRatio: null, comparedTo: 'baseline' },
            }),
        );
        const job = await this.jobs.save(this.jobs.create({ type: 'scenario', status: 'done', result: { scenarioId: row.id } }));
        return { jobId: job.id, scenarioId: row.id };
    }

    getScenario(id: number) {
        return this.scenarios.findOne({ where: { id } }).then((s) => {
            if (!s) throw new NotFoundException('Scenario not found');
            return s;
        });
    }

    listJobs() {
        return this.jobs.find({ order: { id: 'DESC' }, take: 80 });
    }

    getJob(id: number) {
        return this.jobs.findOne({ where: { id } }).then((j) => {
            if (!j) throw new NotFoundException('Job not found');
            return j;
        });
    }

    async upsertDemand(rows: Array<{ organizationId?: number; zoneId: number; hourBucket: string; orderType: string; orderCount: number }>) {
        for (const row of rows) {
            await this.demand
                .createQueryBuilder()
                .insert()
                .into(DemandAgg)
                .values({
                    organizationId: row.organizationId ?? null,
                    zoneId: row.zoneId,
                    hourBucket: new Date(row.hourBucket),
                    orderType: row.orderType,
                    orderCount: row.orderCount,
                })
                .orUpdate(['order_count'], ['organization_id', 'zone_id', 'hour_bucket', 'order_type'])
                .execute();
        }
        return { accepted: rows.length };
    }

    async geocode(q: string) {
        const token = process.env.MAPBOX_ACCESS_TOKEN;
        if (token) {
            const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?country=vn&limit=5&access_token=${encodeURIComponent(token)}`;
            const res = await fetch(url);
            if (res.ok) {
                const data = (await res.json()) as { features?: Array<{ place_name: string; center: [number, number] }> };
                return (data.features ?? []).map((f) => ({ label: f.place_name, lat: f.center[1], lon: f.center[0], source: 'mapbox' }));
            }
        }
        const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(q)}`;
        const res = await fetch(url, { headers: { 'User-Agent': 'smartcity-logistics-demo' } });
        if (!res.ok) return [];
        const data = (await res.json()) as Array<{ display_name: string; lat: string; lon: string }>;
        return data.map((d) => ({ label: d.display_name, lat: Number(d.lat), lon: Number(d.lon), source: 'nominatim' }));
    }
}
