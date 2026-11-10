import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('analytics_snapshots')
@Index(['snapshotDate', 'carrierId'], { unique: true })
export class AnalyticsSnapshot {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'snapshot_date', type: 'date' })
    snapshotDate: Date;

    @Column({ name: 'carrier_id', nullable: true })
    carrierId: number | null;

    @Column({ name: 'orders_total', default: 0 })
    ordersTotal: number;

    @Column({ name: 'orders_delivered', default: 0 })
    ordersDelivered: number;

    @Column({ name: 'orders_failed', default: 0 })
    ordersFailed: number;

    @Column({ name: 'routes_completed', default: 0 })
    routesCompleted: number;

    @Column({ name: 'total_distance_km', type: 'double', nullable: true })
    totalDistanceKm: number | null;

    @Column({ name: 'estimated_co2_grams', type: 'double', nullable: true })
    estimatedCo2Grams: number | null;

    @Column({ name: 'cod_collected_total', type: 'double', nullable: true })
    codCollectedTotal: number | null;

    @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
    createdAt: Date;
}
