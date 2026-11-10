import { EntityManager, EntityTarget, ObjectLiteral } from 'typeorm';
import {
    AnalyticsSnapshot,
    Carrier,
    Charger,
    DemandAgg,
    Dock,
    EmissionFactor,
    Facility,
    IssueReport,
    JobRecord,
    Membership,
    Order,
    Organization,
    Permission,
    Plan,
    PlatformApiClient,
    Restriction,
    RoadSegment,
    Role,
    RolePermission,
    Route,
    Scenario,
    ShipperProfile,
    SpeedProfile,
    Stop,
    SurveyAssignment,
    SurveyForm,
    SurveyResponse,
    Telemetry,
    TrafficProbe,
    TrafficQuota,
    TrafficSample,
    User,
    Vehicle,
    Zone,
} from './entities';

const ENTITY_MAP: Record<string, EntityTarget<ObjectLiteral>> = {
    organization: Organization,
    carrier: Carrier,
    vehicle: Vehicle,
    facility: Facility,
    charger: Charger,
    dock: Dock,
    zone: Zone,
    roadSegment: RoadSegment,
    restriction: Restriction,
    platformApiClient: PlatformApiClient,
    order: Order,
    route: Route,
    stop: Stop,
    telemetry: Telemetry,
    analyticsSnapshot: AnalyticsSnapshot,
    user: User,
    shipperProfile: ShipperProfile,
    membership: Membership,
    role: Role,
    permission: Permission,
    rolePermission: RolePermission,
    surveyForm: SurveyForm,
    surveyAssignment: SurveyAssignment,
    surveyResponse: SurveyResponse,
    emissionFactor: EmissionFactor,
    issueReport: IssueReport,
    plan: Plan,
    scenario: Scenario,
    jobRecord: JobRecord,
    demandAgg: DemandAgg,
    trafficProbe: TrafficProbe,
    trafficSample: TrafficSample,
    speedProfile: SpeedProfile,
    trafficQuota: TrafficQuota,
};

function delegate(manager: EntityManager, key: string) {
    const Entity = ENTITY_MAP[key];
    if (!Entity) {
        throw new Error(`Unknown seed entity: ${key}`);
    }
    return {
        create: async ({ data }: { data: ObjectLiteral }) => {
            const repo = manager.getRepository(Entity);
            const row = repo.create(data) as ObjectLiteral;
            const now = new Date();
            if ('createdAt' in row && row.createdAt == null) row.createdAt = now;
            if ('updatedAt' in row && row.updatedAt == null) row.updatedAt = now;
            return repo.save(row);
        },
        update: async ({ where, data }: { where: ObjectLiteral; data: ObjectLiteral }) => {
            await manager.update(Entity, where, data);
            return manager.findOne(Entity, { where });
        },
    };
}

type SeedDelegate = {
    create: (args: { data: ObjectLiteral }) => Promise<ObjectLiteral>;
    update: (args: { where: ObjectLiteral; data: ObjectLiteral }) => Promise<ObjectLiteral | null>;
};

/** Minimal Prisma-shaped client for seed script only. */
export function createSeedClient(manager: EntityManager) {
    const client = {} as Record<string, SeedDelegate> & { $executeRawUnsafe: (sql: string) => Promise<unknown> };
    for (const key of Object.keys(ENTITY_MAP)) {
        client[key] = delegate(manager, key);
    }
    client.$executeRawUnsafe = (sql: string) => manager.query(sql);
    return client;
}
