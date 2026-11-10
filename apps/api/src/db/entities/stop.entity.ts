import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Route } from './route.entity';
import { Order } from './order.entity';

@Entity('stops')
@Index('stops_route_id_sequence_idx', ['routeId', 'sequence'])
@Index('stops_order_id_idx', ['orderId'])
export class Stop {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'route_id' })
    routeId: number;

    @Column({ name: 'order_id' })
    orderId: number;

    @Column()
    sequence: number;

    @Column()
    type: string;

    @Column({ nullable: true })
    address: string | null;

    @Column({ type: 'double' })
    latitude: number;

    @Column({ type: 'double' })
    longitude: number;

    @Column({ name: 'contact_name', nullable: true })
    contactName: string | null;

    @Column({ name: 'contact_phone', nullable: true })
    contactPhone: string | null;

    @Column({ name: 'time_window_start', type: 'datetime', precision: 3, nullable: true })
    timeWindowStart: Date | null;

    @Column({ name: 'time_window_end', type: 'datetime', precision: 3, nullable: true })
    timeWindowEnd: Date | null;

    @Column({ default: 'pending' })
    status: string;

    @Column({ name: 'arrived_at', type: 'datetime', precision: 3, nullable: true })
    arrivedAt: Date | null;

    @Column({ name: 'completed_at', type: 'datetime', precision: 3, nullable: true })
    completedAt: Date | null;

    @Column({ name: 'failed_reason', nullable: true })
    failedReason: string | null;

    @Column({ name: 'pod_photo_url', nullable: true })
    podPhotoUrl: string | null;

    @Column({ name: 'pod_signature_url', nullable: true })
    podSignatureUrl: string | null;

    @Column({ name: 'pod_note', nullable: true })
    podNote: string | null;

    @Column({ name: 'cod_amount_due', type: 'double', nullable: true, default: 0 })
    codAmountDue: number | null;

    @Column({ name: 'cod_amount_collected', type: 'double', nullable: true, default: 0 })
    codAmountCollected: number | null;

    @Column({ name: 'cod_collected', default: false })
    codCollected: boolean;

    @Column({ name: 'cod_collected_at', type: 'datetime', precision: 3, nullable: true })
    codCollectedAt: Date | null;

    @CreateDateColumn({ name: 'createdAt', type: 'datetime', precision: 3 })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updatedAt', type: 'datetime', precision: 3 })
    updatedAt: Date;

    @ManyToOne(() => Route, (r) => r.stops, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'route_id' })
    route: Route;

    @ManyToOne(() => Order, (o) => o.stops)
    @JoinColumn({ name: 'order_id' })
    order: Order;
}
