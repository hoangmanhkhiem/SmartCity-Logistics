import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Carrier } from './carrier.entity';
import { User } from './user.entity';
import { Zone } from './zone.entity';
import { PlatformApiClient } from './platform-api-client.entity';
import { Stop } from './stop.entity';

@Entity('orders')
@Index('orders_platform_api_client_id_external_ref_idx', ['platformApiClientId', 'externalRef'])
@Index('orders_carrier_id_status_idx', ['carrierId', 'status'])
@Index('orders_zone_id_status_idx', ['zoneId', 'status'])
export class Order {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'carrier_id' })
    carrierId: number;

    @Column({ name: 'customer_id', nullable: true })
    customerId: number | null;

    @Column({ name: 'zone_id', nullable: true })
    zoneId: number | null;

    @Column({ name: 'order_number', unique: true })
    orderNumber: string;

    @Column({ name: 'tracking_no', unique: true })
    trackingNo: string;

    @Column({ default: 'pending' })
    status: string;

    @Column({ name: 'pickup_address', nullable: true })
    pickupAddress: string | null;

    @Column({ name: 'pickup_lat', type: 'double', nullable: true })
    pickupLat: number | null;

    @Column({ name: 'pickup_lon', type: 'double', nullable: true })
    pickupLon: number | null;

    @Column({ name: 'pickup_phone', nullable: true })
    pickupPhone: string | null;

    @Column({ name: 'delivery_address', nullable: true })
    deliveryAddress: string | null;

    @Column({ name: 'delivery_lat', type: 'double', nullable: true })
    deliveryLat: number | null;

    @Column({ name: 'delivery_lon', type: 'double', nullable: true })
    deliveryLon: number | null;

    @Column({ name: 'delivery_phone', nullable: true })
    deliveryPhone: string | null;

    @Column({ name: 'weight_kg', type: 'double', nullable: true })
    weightKg: number | null;

    @Column({ name: 'item_count', nullable: true })
    itemCount: number | null;

    @Column({ name: 'cod_amount', type: 'double', nullable: true, default: 0 })
    codAmount: number | null;

    @Column({ name: 'source_url', nullable: true })
    sourceUrl: string | null;

    @Column({ name: 'external_ref', nullable: true })
    externalRef: string | null;

    @Column({ name: 'fulfillment_channel', nullable: true })
    fulfillmentChannel: string | null;

    @Column({ name: 'platform_api_client_id', nullable: true })
    platformApiClientId: number | null;

    @Column({ name: 'time_window_start', type: 'datetime', precision: 3, nullable: true })
    timeWindowStart: Date | null;

    @Column({ name: 'time_window_end', type: 'datetime', precision: 3, nullable: true })
    timeWindowEnd: Date | null;

    @Column({ default: 1 })
    priority: number;

    @Column({ nullable: true })
    notes: string | null;

    @Column({ default: 'simulated' })
    source: string;

    @Column({ default: true })
    verified: boolean;

    @CreateDateColumn({ name: 'createdAt', type: 'datetime', precision: 3 })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updatedAt', type: 'datetime', precision: 3 })
    updatedAt: Date;

    @ManyToOne(() => Carrier, (c) => c.orders)
    @JoinColumn({ name: 'carrier_id' })
    carrier: Carrier;

    @ManyToOne(() => User, (u) => u.orders)
    @JoinColumn({ name: 'customer_id' })
    customer: User | null;

    @ManyToOne(() => Zone, (z) => z.orders)
    @JoinColumn({ name: 'zone_id' })
    zone: Zone | null;

    @ManyToOne(() => PlatformApiClient, (p) => p.orders, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'platform_api_client_id' })
    platformApiClient: PlatformApiClient | null;

    @OneToMany(() => Stop, (s) => s.order)
    stops: Stop[];
}
