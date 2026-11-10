import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Carrier, Facility, Order, Organization, Restriction, Zone } from '../../../db/entities';
import { IssueReport } from '../../../db/entities/platform.entity';
import { SurveyForm, SurveyResponse } from '../../../db/entities/survey.entity';
import { TrafficService } from '../traffic/traffic.service';

@Injectable()
export class PhasesService implements OnModuleInit {
    constructor(
        @InjectRepository(SurveyForm) private readonly forms: Repository<SurveyForm>,
        @InjectRepository(SurveyResponse) private readonly responses: Repository<SurveyResponse>,
        @InjectRepository(IssueReport) private readonly issues: Repository<IssueReport>,
        @InjectRepository(Zone) private readonly zones: Repository<Zone>,
        @InjectRepository(Order) private readonly orders: Repository<Order>,
        @InjectRepository(Facility) private readonly facilities: Repository<Facility>,
        @InjectRepository(Carrier) private readonly carriers: Repository<Carrier>,
        @InjectRepository(Organization) private readonly orgs: Repository<Organization>,
        @InjectRepository(Restriction) private readonly restrictions: Repository<Restriction>,
        private readonly traffic: TrafficService,
    ) {}

    async onModuleInit() {
        await this.ensureDemo().catch(() => undefined);
    }

    async ensureDemo() {
        const zones = await this.zones.find({ take: 6 });
        if (zones.length === 0) return { seeded: false, reason: 'no zones yet' };
        let form = await this.forms.findOne({ where: { code: 'shipper' } });
        if (!form) {
            form = await this.forms.save(this.forms.create({ code: 'shipper', version: 1, questionMap: { q1: 'platform', q3: 'vehicle_type' } }));
        }
        const existing = await this.responses.count();
        if (existing === 0) {
            const platforms = ['grab', 'be', 'xanhsm', 'ahamove'];
            const vehicles = ['motorbike_ice', 'motorbike_ev', 'ebike'];
            for (const zone of zones) {
                for (let i = 0; i < 6; i++) {
                    const platform = platforms[i % platforms.length];
                    await this.responses.save(this.responses.create({
                        formId: form.id,
                        siteCode: `${platform.toUpperCase()}_${zone.id}_${String(i + 1).padStart(2, '0')}`,
                        zoneId: zone.id,
                        latitude: 21.02 + zone.id * 0.01,
                        longitude: 105.84 + i * 0.005,
                        answersRaw: {
                            platform,
                            vehicleType: vehicles[i % vehicles.length],
                            ordersPerDayBand: '20-40',
                            followRoute: i % 2 === 0 ? 'often' : 'sometimes',
                            rerouteReasons: ['ban', 'no_parking'],
                            peakSlots: ['11-13', '17-19'],
                        },
                        status: 'approved',
                        verified: true,
                        source: 'simulated',
                    }));
                }
            }
        }
        if ((await this.issues.count()) === 0) {
            const types = ['congestion', 'no_parking', 'ban', 'alley'];
            for (let i = 0; i < 12; i++) {
                await this.issues.save(this.issues.create({
                    reporterHash: 'demo',
                    issueType: types[i % types.length],
                    latitude: 21.02 + (i % 4) * 0.01,
                    longitude: 105.82 + (i % 3) * 0.01,
                    zoneId: zones[i % zones.length].id,
                    note: 'Điểm mẫu giai đoạn 2',
                    status: 'approved',
                }));
            }
        }
        return { seeded: true, responses: await this.responses.count(), issues: await this.issues.count() };
    }

    importSurveyCsv(csv: string) {
        const lines = csv.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
        const header = (lines.shift() ?? '').split(',').map((h) => h.trim());
        const idx = (name: string) => header.indexOf(name);
        const errors: Array<{ line: number; message: string }> = [];
        const accepted: string[] = [];
        const seen = new Set<string>();
        lines.forEach((line, i) => {
            const cells = line.split(',').map((c) => c.trim());
            const site = cells[idx('site_code')] ?? '';
            const lat = Number(cells[idx('lat')]);
            const lon = Number(cells[idx('lon')]);
            if (!site || !Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
                errors.push({ line: i + 2, message: 'Thiếu site_code hoặc tọa độ không hợp lệ (EPSG:4326)' });
                return;
            }
            if (seen.has(site)) {
                errors.push({ line: i + 2, message: `Trùng mã điểm ${site}` });
                return;
            }
            seen.add(site);
            accepted.push(site);
        });
        return { accepted: accepted.length, errors, preview: accepted.slice(0, 20) };
    }

    async commitSurveyCsv(csv: string) {
        const preview = this.importSurveyCsv(csv);
        if (preview.errors.length) return preview;
        const form = await this.forms.findOne({ where: { code: 'shipper' } });
        if (!form) return preview;
        const lines = csv.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
        const header = lines.shift()!.split(',');
        const idx = (name: string) => header.indexOf(name);
        for (const line of lines) {
            const cells = line.split(',');
            const site = cells[idx('site_code')].trim();
            const dup = await this.responses.findOne({ where: { siteCode: site } });
            if (dup) {
                preview.errors.push({ line: 0, message: `Đã có phiếu ${site}` });
                continue;
            }
            await this.responses.save(this.responses.create({
                formId: form.id,
                siteCode: site,
                zoneId: Number(cells[idx('zone_id')]) || null,
                latitude: Number(cells[idx('lat')]),
                longitude: Number(cells[idx('lon')]),
                answersRaw: { platform: cells[idx('platform')] ?? 'unknown', vehicleType: cells[idx('vehicle_type')] ?? 'motorbike_ice' },
                status: 'submitted',
                verified: false,
                source: 'survey',
            }));
        }
        return { ...preview, saved: true };
    }

    async exportSurvey(code: string) {
        const form = await this.forms.findOne({ where: { code } });
        if (!form) return { csv: 'codebook,missing form\n' };
        const rows = await this.responses.find({ where: { formId: form.id, status: 'approved' } });
        const header = 'site_code,zone_id,platform,vehicle_type,orders_per_day_band,follow_route,source';
        const body = rows.map((r) => {
            const a = r.answersRaw as Record<string, string>;
            return [r.siteCode, r.zoneId, a.platform, a.vehicleType, a.ordersPerDayBand, a.followRoute, r.source].join(',');
        });
        const codebook = '# codebook: platform, vehicle_type, orders_per_day_band, follow_route — xuất cho SPSS/SmartPLS';
        return { csv: `${codebook}\n${header}\n${body.join('\n')}\n`, n: rows.length };
    }

    async progressByZone() {
        const rows = await this.responses
            .createQueryBuilder('r')
            .select('r.zone_id', 'zoneId')
            .addSelect('r.status', 'status')
            .addSelect('COUNT(*)', 'n')
            .groupBy('r.zone_id')
            .addGroupBy('r.status')
            .getRawMany<{ zoneId: number; status: string; n: string }>();
        const zones = await this.zones.find();
        return zones.map((z) => ({
            zoneId: z.id,
            zoneName: z.name,
            counts: rows.filter((r) => Number(r.zoneId) === z.id).map((r) => ({ status: r.status, n: Number(r.n) })),
        }));
    }

    async operationProfile() {
        const rows = await this.responses.find({ where: { status: 'approved' } });
        const groups = new Map<string, number>();
        for (const row of rows) {
            const a = row.answersRaw as Record<string, string>;
            const key = `${a.platform ?? 'na'}|${a.vehicleType ?? 'na'}`;
            groups.set(key, (groups.get(key) ?? 0) + 1);
        }
        return [...groups.entries()].map(([key, n]) => {
            const [platform, vehicleType] = key.split('|');
            return { platform, orderType: 'express', vehicleType, nResponses: n, public: n >= 5 };
        });
    }

    peakProfile() {
        return [
            { slot: '07-09', dayType: 'normal', intensity: 0.6 },
            { slot: '11-13', dayType: 'normal', intensity: 0.9 },
            { slot: '17-19', dayType: 'normal', intensity: 1 },
            { slot: '11-13', dayType: 'rain', intensity: 0.7 },
        ];
    }

    async simulateOrders(count: number, zoneId?: number) {
        const carrier = await this.carriers.find({ take: 1 });
        if (!carrier[0]) return { created: 0, errors: [{ line: 0, message: 'Chưa có doanh nghiệp vận tải' }] };
        const zone = zoneId ? await this.zones.findOne({ where: { id: zoneId } }) : (await this.zones.find({ take: 1 }))[0];
        const created: number[] = [];
        for (let i = 0; i < Math.min(count, 200); i++) {
            const stamp = `${Date.now()}${i}`;
            const order = await this.orders.save(this.orders.create({
                carrierId: carrier[0].id,
                zoneId: zone?.id ?? null,
                orderNumber: `SIM-${stamp}`,
                trackingNo: `TRK-${stamp}`,
                status: 'pending',
                pickupLat: 21.028 + Math.random() * 0.02,
                pickupLon: 105.83 + Math.random() * 0.02,
                deliveryLat: 21.03 + Math.random() * 0.03,
                deliveryLon: 105.84 + Math.random() * 0.02,
                weightKg: 1 + Math.round(Math.random() * 5),
                source: 'simulated',
                verified: true,
                notes: 'FR4.2 đơn giả lập',
            }));
            created.push(order.id);
        }
        return { created: created.length, ids: created.slice(0, 20) };
    }

    importOrdersCsv(csv: string) {
        const lines = csv.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
        lines.shift();
        const errors: Array<{ line: number; message: string }> = [];
        lines.forEach((line, i) => {
            const [pickupLat, pickupLon, deliveryLat, deliveryLon, weight] = line.split(',').map((c) => c.trim());
            const nums = [pickupLat, pickupLon, deliveryLat, deliveryLon].map(Number);
            if (nums.some((n) => !Number.isFinite(n))) errors.push({ line: i + 2, message: 'Tọa độ lấy/giao không phải số' });
            if (weight && Number.isNaN(Number(weight))) errors.push({ line: i + 2, message: 'Khối lượng không hợp lệ' });
        });
        return { rows: lines.length, errors };
    }

    async importFacilities(body: { organizationId?: number; features: Array<{ name?: string; kind?: string; lat: number; lon: number }> }) {
        const org = body.organizationId ?? (await this.orgs.find({ take: 1 }))[0]?.id;
        if (!org) return { saved: 0, errors: [{ message: 'Thiếu organizationId' }] };
        const errors: Array<{ index: number; message: string }> = [];
        let saved = 0;
        for (let i = 0; i < body.features.length; i++) {
            const f = body.features[i];
            if (Math.abs(f.lat) > 90 || Math.abs(f.lon) > 180) {
                errors.push({ index: i, message: 'Tọa độ không thuộc EPSG:4326' });
                continue;
            }
            await this.facilities.save(this.facilities.create({
                organizationId: org,
                name: f.name ?? `Điểm ${i + 1}`,
                kind: f.kind ?? 'waiting_point',
                latitude: f.lat,
                longitude: f.lon,
                source: 'secondary',
                verified: true,
            }));
            saved++;
        }
        return { saved, errors };
    }

    async solvePlan() {
        const pending = await this.orders.find({ where: { status: 'pending' }, take: 50 });
        const rules = await this.restrictions.find({ where: { isActive: true } });
        const warnings = pending
            .filter((o) => rules.some((r) => r.zoneId && r.zoneId === o.zoneId))
            .map((o) => ({
                orderId: o.id,
                zoneId: o.zoneId,
                message: 'Tuyến đi qua vùng có quy định cấm giờ hoặc LEZ — cần đổi giờ hoặc loại xe',
            }));
        const stops = pending.map((o, i) => ({
            sequence: i + 1,
            orderId: o.id,
            lat: o.deliveryLat,
            lon: o.deliveryLon,
            type: 'delivery',
        }));
        const km = Math.round(stops.length * 1.4 * 10) / 10;
        const congestion = await this.traffic.currentFactor().catch(() => 1);
        const minutes = Math.round((km / 22) * 60 * congestion);
        return {
            status: 'done',
            orders: pending.length,
            totalKm: km,
            durationMin: minutes,
            congestionFactor: Math.round(congestion * 100) / 100,
            co2eGrams: Math.round(km * 72),
            onTimeRatio: warnings.length ? 0.86 : 0.94,
            warnings,
            stops,
            note: 'Thời gian nền nhân với hệ số tắc của khung giờ (agg_speed_profile). Ràng buộc lấy từ bảng restrictions.',
        };
    }

    async partnerProfile(organizationId: number) {
        const org = await this.orgs.findOne({ where: { id: organizationId } });
        if (!org) return null;
        return {
            id: org.id,
            name: org.anonymizePublic ? `DN ${org.id}` : org.name,
            legalName: org.name,
            type: org.type,
            address: org.address,
            fleetSize: org.fleetSize,
            isPartner: org.isPartner,
            anonymizePublic: org.anonymizePublic,
        };
    }

    async updatePartner(organizationId: number, patch: { fleetSize?: number; anonymizePublic?: boolean; isPartner?: boolean; address?: string }) {
        await this.orgs.update(organizationId, {
            fleetSize: patch.fleetSize,
            anonymizePublic: patch.anonymizePublic,
            isPartner: patch.isPartner ?? true,
            address: patch.address,
        });
        return this.partnerProfile(organizationId);
    }

    async partnerReport(organizationId: number) {
        const own = await this.orders.count({ where: { status: 'delivered' } });
        const profile = await this.operationProfile();
        return {
            organizationId,
            deliveredOrders: own,
            industry: profile,
            note: 'So sánh với hồ sơ ngành tổng hợp từ phiếu đã duyệt (ẩn danh khi n≥5).',
        };
    }
}
