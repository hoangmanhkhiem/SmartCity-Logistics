import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
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
} from './entities';
import { CENTRAL_HUBS, MINI_SITES, VEHICLE_TEMPLATES } from '../http/routes/simulation/hub-layout';
import { LEZ_A_BOUNDARY, LEZ_B_BOUNDARY, TRANSFER_A, TRANSFER_B } from '../http/routes/simulation/lez-demo';
import { OsrmClient } from '../http/routes/simulation/osrm.client';
import { SimulationService } from '../http/routes/simulation/simulation.service';

type SeedClient = {
    zone: { create: (a: { data: Record<string, unknown> }) => Promise<{ id: number; name: string }> };
    facility: { create: (a: { data: Record<string, unknown> }) => Promise<{ id: number }> };
    restriction: { create: (a: { data: Record<string, unknown> }) => Promise<unknown> };
    vehicle: { create: (a: { data: Record<string, unknown> }) => Promise<unknown> };
};

export async function seedHubSimulation(opts: {
    prisma: SeedClient | Record<string, unknown>;
    ds: DataSource;
    orgA: { id: number } | Record<string, unknown>;
    orgB: { id: number } | Record<string, unknown>;
    orgC: { id: number } | Record<string, unknown>;
    orgPlatform: { id: number } | Record<string, unknown>;
    carriers: Array<{ id: number; organizationId: number } | Record<string, unknown>>;
    zoneByName: Map<string, { id: number } | Record<string, unknown>>;
}) {
    const prisma = opts.prisma as SeedClient;
    const ds = opts.ds;
    const orgA = opts.orgA as { id: number };
    const orgB = opts.orgB as { id: number };
    const orgC = opts.orgC as { id: number };
    const orgPlatform = opts.orgPlatform as { id: number };
    const carriers = opts.carriers as Array<{ id: number; organizationId: number }>;
    const zoneByName = opts.zoneByName as Map<string, { id: number }>;
    console.log('Creating hub 2-cấp + LEZ 2027 (FR21–FR27)...');

    const zoneMelinh = await prisma.zone.create({
        data: {
            name: 'Mê Linh',
            type: 'district',
            description: 'Cửa ngõ Bắc — KCN Quang Minh (giả lập vị trí Hub tổng DN A)',
            dataSource: 'SIMULATED',
            sourceName: 'Brief 25/11/2026',
            sourceDate: '2026-11-25',
        },
    });
    const zoneGiaLam = await prisma.zone.create({
        data: {
            name: 'Gia Lâm',
            type: 'district',
            description: 'Cửa ngõ Đông — KCN Hapro Lệ Chi và ICD Cổ Bi (giả lập Hub tổng DN B/C)',
            dataSource: 'SIMULATED',
            sourceName: 'Brief 25/11/2026',
            sourceDate: '2026-11-25',
        },
    });
    zoneByName.set('Mê Linh', zoneMelinh);
    zoneByName.set('Gia Lâm', zoneGiaLam);

    const zoneLezA = await prisma.zone.create({
        data: {
            name: 'LEZ 2027 — Hoàn Kiếm & Cửa Nam',
            type: 'lez',
            description: 'Kịch bản A demo theo đề án Vành đai 1 (QĐ 3273) — ranh gần đúng, nhãn giả lập',
            boundary: JSON.stringify(LEZ_A_BOUNDARY),
            dataSource: 'SIMULATED',
            sourceName: 'lez_demo.geojson',
            sourceDate: '2026-11-25',
        },
    });
    const zoneLezB = await prisma.zone.create({
        data: {
            name: 'LEZ 2028 — Vành đai 1',
            type: 'lez',
            description: 'Kịch bản B demo toàn Vành đai 1 — ranh gần đúng',
            boundary: JSON.stringify(LEZ_B_BOUNDARY),
            dataSource: 'SIMULATED',
            sourceName: 'lez_demo.geojson',
            sourceDate: '2026-11-25',
        },
    });
    await prisma.restriction.create({
        data: {
            zoneId: zoneLezA.id,
            severity: 'prohibited',
            vehicleTypes: ['motorbike_ice', 'truck', 'van'],
            timeFrom: '00:00',
            timeTo: '23:59',
            daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            description: 'LEZ 2027 khu vực 1–3 Hoàn Kiếm & Cửa Nam — xe xăng/dầu dừng tại trạm trung chuyển',
            source: 'simulated',
            dataSource: 'SIMULATED',
            sourceName: 'FR27 demo',
            effectiveYear: 2027,
        },
    });
    await prisma.restriction.create({
        data: {
            zoneId: zoneLezB.id,
            severity: 'prohibited',
            vehicleTypes: ['motorbike_ice', 'truck', 'van'],
            timeFrom: '00:00',
            timeTo: '23:59',
            daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            description: 'LEZ đi trước lộ trình 2028 — toàn Vành đai 1',
            source: 'simulated',
            dataSource: 'SIMULATED',
            sourceName: 'FR27 demo',
            effectiveYear: 2028,
        },
    });

    const orgMap = { A: orgA, B: orgB, C: orgC } as const;
    const zoneForCentral = { A: zoneMelinh, B: zoneGiaLam, C: zoneGiaLam };

    for (const c of CENTRAL_HUBS) {
        const org = orgMap[c.orgKey];
        const zone = zoneForCentral[c.orgKey];
        const central = await prisma.facility.create({
            data: {
                organizationId: org.id,
                zoneId: zone.id,
                name: c.name,
                kind: 'hub',
                hubTier: 'CENTRAL',
                latitude: c.lat,
                longitude: c.lon,
                address: c.address,
                openingTime: '06:00',
                closingTime: '22:00',
                capacityKg: 1_000_000,
                capacityM3: 4000,
                capacity: 1000000,
                dataSource: 'SIMULATED',
                sourceName: 'Brief 25/11/2026',
                sourceDate: '2026-11-25',
                description: `Hub tổng giả lập của DN ${c.orgKey}`,
            },
        });
        const offset = c.orgKey === 'A' ? 0 : c.orgKey === 'B' ? 0.0016 : -0.0016;
        for (const mini of MINI_SITES) {
            const z = zoneByName.get(mini.zoneName);
            const tons = mini.density === 'high' ? 2 : 1;
            await prisma.facility.create({
                data: {
                    organizationId: org.id,
                    zoneId: z?.id ?? null,
                    wardId: z?.id ?? null,
                    parentHubId: central.id,
                    name: `${mini.name} · DN ${c.orgKey}`,
                    kind: 'hub',
                    hubTier: 'MINI',
                    latitude: mini.lat + offset,
                    longitude: mini.lon + offset,
                    address: `${mini.zoneName} (giả lập)`,
                    openingTime: '07:00',
                    closingTime: '21:00',
                    capacityKg: tons * 1000,
                    capacityM3: tons * 4,
                    capacity: tons * 1000,
                    dataSource: 'SIMULATED',
                    sourceName: 'Brief 25/11/2026',
                    sourceDate: '2026-11-25',
                },
            });
        }
    }

    for (const t of TRANSFER_A) {
        await prisma.facility.create({
            data: {
                organizationId: orgPlatform.id,
                zoneId: zoneLezA.id,
                name: t.name,
                kind: 'hub',
                hubTier: 'TRANSFER',
                latitude: t.lat,
                longitude: t.lon,
                capacityKg: 2000,
                capacityM3: 10,
                dataSource: 'SIMULATED',
                sourceName: 'FR27 trạm A',
                description: 'Trạm trung chuyển kịch bản LEZ A — xe xăng dừng, sang xe điện',
            },
        });
    }
    for (const t of TRANSFER_B) {
        await prisma.facility.create({
            data: {
                organizationId: orgPlatform.id,
                zoneId: zoneLezB.id,
                name: t.name,
                kind: 'hub',
                hubTier: 'TRANSFER',
                latitude: t.lat,
                longitude: t.lon,
                capacityKg: 2500,
                capacityM3: 12,
                dataSource: 'SIMULATED',
                sourceName: 'FR27 trạm B',
            },
        });
    }

    for (const carrier of carriers) {
        for (const [i, tpl] of VEHICLE_TEMPLATES.entries()) {
            await prisma.vehicle.create({
                data: {
                    carrierId: carrier.id,
                    type: tpl.type,
                    plate: `SIM${carrier.id}${i}-${9000 + i}`,
                    brand: 'Mẫu giả lập',
                    model: tpl.type,
                    year: 2024,
                    capacity: tpl.payloadKg,
                    volume: tpl.cargoM3,
                    payloadKg: tpl.payloadKg,
                    cargoM3: tpl.cargoM3,
                    fuelType: tpl.fuelType,
                    isElectric: tpl.fuelType === 'electric',
                    emissionStandard: tpl.emissionStandard,
                    emissionFactor: tpl.co2GPerKm,
                    co2GPerKm: tpl.co2GPerKm,
                    lezAllowed: tpl.lezAllowed,
                    dataSource: 'SIMULATED',
                    sourceName: 'Bộ xe mẫu FR3',
                    status: 'available',
                },
            });
        }
    }

    const osrm = new OsrmClient({ get: (k: string) => (k === 'osrmUrl' ? process.env.OSRM_URL : undefined) } as ConfigService);
    const sim = new SimulationService(
        ds.getRepository(SimScenario),
        ds.getRepository(SimOrder),
        ds.getRepository(ShipmentLeg),
        ds.getRepository(DeliveryEvent),
        ds.getRepository(Facility),
        ds.getRepository(Organization),
        ds.getRepository(Zone),
        ds.getRepository(Vehicle),
        ds.getRepository(HubCapacitySnapshot),
        ds.getRepository(WardWeight),
        ds.getRepository(SegmentDeliveryFlow),
        ds.getRepository(ScenarioFeedback),
        osrm,
    );

    const weights = [
        ['Quận Ba Đình', 'high', 2.5],
        ['Quận Cầu Giấy', 'high', 2.5],
        ['Quận Đống Đa', 'high', 2.5],
        ['Quận Hoàn Kiếm', 'normal', 1],
        ['Quận Thanh Xuân', 'normal', 1],
        ['Phường Cửa Nam', 'normal', 1],
        ['Phường Giảng Võ', 'normal', 1],
    ] as const;
    for (const [name, density, weight] of weights) {
        const z = zoneByName.get(name);
        if (!z) continue;
        await ds.getRepository(WardWeight).save(
            ds.getRepository(WardWeight).create({
                scenarioId: null,
                wardId: z.id,
                weight,
                densityClass: density,
            }),
        );
    }

    console.log('Sinh kịch bản 1.000 đơn (seed 20251125) — không LEZ, A, B...');
    for (const [lezMode, name] of [
        ['none', 'Không LEZ · 1.000 đơn'],
        ['A', 'LEZ 2027 (A) · Hoàn Kiếm & Cửa Nam'],
        ['B', 'LEZ Vành đai 1 (B)'],
    ] as const) {
        const s = await sim.createScenario({ name, seed: 20251125, orderCount: 1000, lezMode });
        await sim.generate(s.id, { useOsrm: false });
        await sim.publish(s.id);
    }
}
