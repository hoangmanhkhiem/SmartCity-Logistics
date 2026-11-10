import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity('traffic_probes')
export class TrafficProbe {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 120 })
    name: string;

    @Column({ length: 64 })
    ward: string;

    @Column({ type: 'double' })
    latitude: number;

    @Column({ type: 'double' })
    longitude: number;

    @Column({ name: 'is_active', default: true })
    isActive: boolean;
}

@Entity('traffic_samples')
export class TrafficSample {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'probe_id' })
    probeId: number;

    @Column({ name: 'current_speed', type: 'double' })
    currentSpeed: number;

    @Column({ name: 'free_flow_speed', type: 'double' })
    freeFlowSpeed: number;

    @Column({ name: 'travel_time_sec', type: 'int' })
    travelTimeSec: number;

    @Column({ type: 'double', default: 1 })
    confidence: number;

    @Column({ name: 'road_closure', default: false })
    roadClosure: boolean;

    @Column({ length: 32, default: 'survey_fallback' })
    source: string;

    @CreateDateColumn({ name: 'sampled_at', type: 'datetime', precision: 3 })
    sampledAt: Date;
}

@Entity('speed_profiles')
@Unique('uq_speed_profile', ['probeId', 'dayType', 'hourBucket'])
export class SpeedProfile {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'probe_id' })
    probeId: number;

    @Column({ name: 'day_type', length: 16 })
    dayType: string;

    @Column({ name: 'hour_bucket', type: 'tinyint' })
    hourBucket: number;

    @Column({ name: 'median_speed', type: 'double' })
    medianSpeed: number;

    @Column({ name: 'congestion_factor', type: 'double' })
    congestionFactor: number;

    @Column({ name: 'sample_count', type: 'int', default: 0 })
    sampleCount: number;
}

@Entity('traffic_quota')
export class TrafficQuota {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'month_key', length: 7, unique: true })
    monthKey: string;

    @Column({ type: 'int', default: 0 })
    used: number;

    @Column({ name: 'monthly_limit', type: 'int', default: 20000 })
    monthlyLimit: number;
}
