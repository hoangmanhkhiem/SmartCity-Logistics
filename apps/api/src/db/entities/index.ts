import { Organization } from './organization.entity';
import { Carrier } from './carrier.entity';
import { Vehicle } from './vehicle.entity';
import { Facility, Charger, FuelPump, Dock } from './facility.entity';
import { Zone, RoadSegment, Restriction } from './zone.entity';
import { PlatformApiClient } from './platform-api-client.entity';
import { Order } from './order.entity';
import { Route } from './route.entity';
import { Stop } from './stop.entity';
import { Telemetry } from './telemetry.entity';
import { AnalyticsSnapshot } from './analytics-snapshot.entity';
import { User } from './user.entity';
import { ShipperProfile } from './shipper-profile.entity';
import { Role, Permission, RolePermission, Membership } from './rbac.entity';
import { SurveyAssignment, SurveyForm, SurveyResponse } from './survey.entity';
import { DemandAgg, EmissionFactor, IssueReport, JobRecord, Plan, Scenario } from './platform.entity';
import { SpeedProfile, TrafficProbe, TrafficQuota, TrafficSample } from './traffic.entity';

export {
    Organization,
    Carrier,
    Vehicle,
    Facility,
    Charger,
    FuelPump,
    Dock,
    Zone,
    RoadSegment,
    Restriction,
    PlatformApiClient,
    Order,
    Route,
    Stop,
    Telemetry,
    AnalyticsSnapshot,
    User,
    ShipperProfile,
    Role,
    Permission,
    RolePermission,
    Membership,
    SurveyForm,
    SurveyAssignment,
    SurveyResponse,
    EmissionFactor,
    IssueReport,
    Plan,
    Scenario,
    JobRecord,
    DemandAgg,
    TrafficProbe,
    TrafficSample,
    SpeedProfile,
    TrafficQuota,
};

export const ENTITIES = [
    Organization,
    Carrier,
    Vehicle,
    Facility,
    Charger,
    FuelPump,
    Dock,
    Zone,
    RoadSegment,
    Restriction,
    PlatformApiClient,
    Order,
    Route,
    Stop,
    Telemetry,
    AnalyticsSnapshot,
    User,
    ShipperProfile,
    Role,
    Permission,
    RolePermission,
    Membership,
    SurveyForm,
    SurveyAssignment,
    SurveyResponse,
    EmissionFactor,
    IssueReport,
    Plan,
    Scenario,
    JobRecord,
    DemandAgg,
    TrafficProbe,
    TrafficSample,
    SpeedProfile,
    TrafficQuota,
];
