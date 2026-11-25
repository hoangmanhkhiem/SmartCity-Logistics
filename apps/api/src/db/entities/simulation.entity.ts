import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Facility } from './facility.entity';
import { Organization } from './organization.entity';
import { Zone } from './zone.entity';
import { User } from './user.entity';
import { Vehicle } from './vehicle.entity';

@Entity('sim_scenarios')
export class SimScenario {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({ name: 'order_count', default: 1000 })
    orderCount: number;

    @Column({ default: 20251125 })
    seed: number;

    @Column({ name: 'lez_mode', length: 16, default: 'none' })
    lezMode: string;

    @Column({ length: 16, default: 'draft' })
    status: string;

    @Column({ name: 'published_at', type: 'datetime', precision: 3, nullable: true })
    publishedAt: Date | null;

    @Column({ type: 'json', nullable: true })
    kpis: Record<string, unknown> | null;

    @Column({ name: 'data_source', length: 32, default: 'SIMULATED' })
    dataSource: string;

    @Column({ name: 'source_name', nullable: true })
    sourceName: string | null;

    @Column({ name: 'source_date', type: 'date', nullable: true })
    sourceDate: string | null;

    @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 3 })
    updatedAt: Date;
}

@Entity('sim_orders')
export class SimOrder {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'scenario_id' })
    scenarioId: number;

    @Column({ name: 'organization_id' })
    organizationId: number;

    @Column({ name: 'pickup_hub_id' })
    pickupHubId: number;

    @Column({ name: 'dest_hub_id', nullable: true })
    destHubId: number | null;

    @Column({ name: 'ward_id', nullable: true })
    wardId: number | null;

    @Column({ name: 'dest_lat', type: 'double' })
    destLat: number;

    @Column({ name: 'dest_lon', type: 'double' })
    destLon: number;

    @Column({ name: 'weight_kg', type: 'double' })
    weightKg: number;

    @Column({ name: 'volume_m3', type: 'double' })
    volumeM3: number;

    @Column({ name: 'cargo_type', length: 64, default: 'parcel' })
    cargoType: string;

    @Column({ name: 'package_count', default: 1 })
    packageCount: number;

    @Column({ name: 'created_at_sim', type: 'datetime', precision: 3 })
    createdAtSim: Date;

    @Column({ name: 'data_source', length: 32, default: 'SIMULATED' })
    dataSource: string;

    @ManyToOne(() => SimScenario, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'scenario_id' })
    scenario: SimScenario;

    @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'organization_id' })
    organization: Organization;

    @ManyToOne(() => Facility, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'pickup_hub_id' })
    pickupHub: Facility;

    @ManyToOne(() => Facility, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'dest_hub_id' })
    destHub: Facility | null;

    @ManyToOne(() => Zone, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'ward_id' })
    ward: Zone | null;
}

@Entity('shipment_legs')
export class ShipmentLeg {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'order_id' })
    orderId: number;

    @Column({ name: 'leg_no' })
    legNo: number;

    @Column({ name: 'from_hub_id', nullable: true })
    fromHubId: number | null;

    @Column({ name: 'to_hub_id', nullable: true })
    toHubId: number | null;

    @Column({ name: 'vehicle_id', nullable: true })
    vehicleId: number | null;

    @Column({ name: 'vehicle_type', length: 32, nullable: true })
    vehicleType: string | null;

    @Column({ name: 'route_geom', type: 'text', nullable: true })
    routeGeom: string | null;

    @Column({ name: 'distance_km', type: 'double', default: 0 })
    distanceKm: number;

    @Column({ name: 'duration_min', type: 'double', default: 0 })
    durationMin: number;

    @Column({ name: 'co2_g', type: 'double', default: 0 })
    co2G: number;

    @Column({ name: 'hour_bucket', type: 'tinyint', nullable: true })
    hourBucket: number | null;

    @ManyToOne(() => SimOrder, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'order_id' })
    order: SimOrder;

    @ManyToOne(() => Facility, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'from_hub_id' })
    fromHub: Facility | null;

    @ManyToOne(() => Facility, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'to_hub_id' })
    toHub: Facility | null;

    @ManyToOne(() => Vehicle, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'vehicle_id' })
    vehicle: Vehicle | null;
}

@Entity('delivery_events')
export class DeliveryEvent {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'order_id' })
    orderId: number;

    @Column({ name: 'leg_id', nullable: true })
    legId: number | null;

    @Column({ name: 'event_type', length: 32 })
    eventType: string;

    @Column({ name: 'hub_id', nullable: true })
    hubId: number | null;

    @Column({ name: 'occurred_at', type: 'datetime', precision: 3 })
    occurredAt: Date;

    @Column({ name: 'fail_reason', type: 'text', nullable: true })
    failReason: string | null;

    @Column({ name: 'share_level', length: 16, default: 'industry' })
    shareLevel: string;

    @ManyToOne(() => SimOrder, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'order_id' })
    order: SimOrder;

    @ManyToOne(() => ShipmentLeg, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'leg_id' })
    leg: ShipmentLeg | null;

    @ManyToOne(() => Facility, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'hub_id' })
    hub: Facility | null;
}

@Entity('hub_capacity_snapshots')
export class HubCapacitySnapshot {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'hub_id' })
    hubId: number;

    @Column({ name: 'used_m3', type: 'double', default: 0 })
    usedM3: number;

    @Column({ name: 'used_kg', type: 'double', default: 0 })
    usedKg: number;

    @Column({ name: 'share_level', length: 16, default: 'industry' })
    shareLevel: string;

    @Column({ name: 'recorded_at', type: 'datetime', precision: 3 })
    recordedAt: Date;

    @ManyToOne(() => Facility, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'hub_id' })
    hub: Facility;
}

@Entity('ward_weights')
export class WardWeight {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'scenario_id', nullable: true })
    scenarioId: number | null;

    @Column({ name: 'ward_id' })
    wardId: number;

    @Column({ type: 'double', default: 1 })
    weight: number;

    @Column({ name: 'density_class', length: 16, default: 'normal' })
    densityClass: string;

    @ManyToOne(() => SimScenario, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'scenario_id' })
    scenario: SimScenario | null;

    @ManyToOne(() => Zone, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'ward_id' })
    ward: Zone;
}

@Entity('segment_delivery_flows')
export class SegmentDeliveryFlow {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'scenario_id' })
    scenarioId: number;

    @Column({ name: 'segment_id', length: 64 })
    segmentId: string;

    @Column({ type: 'tinyint' })
    hour: number;

    @Column({ name: 'vehicle_count', default: 0 })
    vehicleCount: number;

    @Column({ type: 'text', nullable: true })
    geometry: string | null;

    @ManyToOne(() => SimScenario, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'scenario_id' })
    scenario: SimScenario;
}

@Entity('traffic_flow_snapshots')
export class TrafficFlowSnapshot {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'segment_id', length: 64 })
    segmentId: string;

    @Column({ name: 'speed_kmh', type: 'double', nullable: true })
    speedKmh: number | null;

    @Column({ name: 'free_flow_kmh', type: 'double', nullable: true })
    freeFlowKmh: number | null;

    @Column({ name: 'captured_at', type: 'datetime', precision: 3 })
    capturedAt: Date;

    @Column({ name: 'data_source', length: 32, default: 'OPEN' })
    dataSource: string;
}

@Entity('scenario_feedback')
export class ScenarioFeedback {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'scenario_id' })
    scenarioId: number;

    @Column({ name: 'user_id', nullable: true })
    userId: number | null;

    @Column({ length: 16, default: 'neutral' })
    stance: string;

    @Column({ type: 'text', nullable: true })
    content: string | null;

    @Column({ type: 'double', nullable: true })
    latitude: number | null;

    @Column({ type: 'double', nullable: true })
    longitude: number | null;

    @Column({ type: 'text', nullable: true })
    reply: string | null;

    @Column({ length: 16, default: 'new' })
    status: string;

    @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
    createdAt: Date;

    @ManyToOne(() => SimScenario, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'scenario_id' })
    scenario: SimScenario;

    @ManyToOne(() => User, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'user_id' })
    user: User | null;
}
