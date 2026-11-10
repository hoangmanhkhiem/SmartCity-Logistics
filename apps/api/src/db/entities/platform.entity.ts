import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('emission_factors')
export class EmissionFactor {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'vehicle_type' })
    vehicleType: string;

    @Column({ name: 'fuel_type' })
    fuelType: string;

    @Column({ name: 'g_co2e_per_km', type: 'decimal', precision: 8, scale: 2 })
    gCo2ePerKm: string;

    @Column({ name: 'source_ref', nullable: true })
    sourceRef: string | null;

    @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
    createdAt: Date;
}

@Entity('issue_reports')
export class IssueReport {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'reporter_hash', length: 64 })
    reporterHash: string;

    @Column({ name: 'issue_type', length: 32 })
    issueType: string;

    @Column({ type: 'double' })
    latitude: number;

    @Column({ type: 'double' })
    longitude: number;

    @Column({ name: 'zone_id', nullable: true })
    zoneId: number | null;

    @Column({ type: 'text', nullable: true })
    note: string | null;

    @Column({ length: 16, default: 'new' })
    status: string;

    @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
    createdAt: Date;
}

@Entity('plans')
export class Plan {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'organization_id', nullable: true })
    organizationId: number | null;

    @Column({ name: 'solver_params', type: 'json', nullable: true })
    solverParams: Record<string, unknown> | null;

    @Column({ length: 16, default: 'done' })
    status: string;

    @Column({ name: 'objective_value', type: 'double', nullable: true })
    objectiveValue: number | null;

    @Column({ name: 'runtime_ms', nullable: true })
    runtimeMs: number | null;

    @Column({ name: 'result', type: 'json', nullable: true })
    result: Record<string, unknown> | null;

    @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
    createdAt: Date;
}

@Entity('scenarios')
export class Scenario {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({ length: 16, default: 'policy' })
    kind: string;

    @Column({ type: 'json', nullable: true })
    changes: Record<string, unknown> | null;

    @Column({ type: 'json', nullable: true })
    kpis: Record<string, unknown> | null;

    @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
    createdAt: Date;
}

@Entity('jobs')
export class JobRecord {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    type: string;

    @Column({ length: 16, default: 'done' })
    status: string;

    @Column({ type: 'json', nullable: true })
    result: Record<string, unknown> | null;

    @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
    createdAt: Date;
}

@Entity('demand_agg')
export class DemandAgg {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'organization_id', nullable: true })
    organizationId: number | null;

    @Column({ name: 'zone_id' })
    zoneId: number;

    @Column({ name: 'hour_bucket', type: 'datetime', precision: 3 })
    hourBucket: Date;

    @Column({ name: 'order_type', length: 32 })
    orderType: string;

    @Column({ name: 'order_count', default: 0 })
    orderCount: number;

    @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 3 })
    updatedAt: Date;
}
