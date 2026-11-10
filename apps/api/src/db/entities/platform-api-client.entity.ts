import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Carrier } from './carrier.entity';
import { Order } from './order.entity';

@Entity('platform_api_clients')
export class PlatformApiClient {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'carrier_id', nullable: true })
    carrierId: number | null;

    @Column()
    name: string;

    @Column({ name: 'key_prefix' })
    keyPrefix: string;

    @Column({ name: 'key_hash', unique: true })
    keyHash: string;

    @Column({ type: 'json', default: () => "'[\"orders:create\"]'" })
    scopes: string[];

    @Column({ name: 'isActive', default: true })
    isActive: boolean;

    @CreateDateColumn({ name: 'createdAt', type: 'datetime', precision: 3 })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updatedAt', type: 'datetime', precision: 3 })
    updatedAt: Date;

    @ManyToOne(() => Carrier, (c) => c.platformApiClients, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'carrier_id' })
    carrier: Carrier | null;

    @OneToMany(() => Order, (o) => o.platformApiClient)
    orders: Order[];
}
