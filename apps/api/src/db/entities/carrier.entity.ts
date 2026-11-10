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
import { Organization } from './organization.entity';
import { Vehicle } from './vehicle.entity';
import { Order } from './order.entity';
import { Route } from './route.entity';
import { ShipperProfile } from './shipper-profile.entity';
import { PlatformApiClient } from './platform-api-client.entity';

@Entity('carriers')
export class Carrier {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'organization_id' })
    organizationId: number;

    @Column()
    name: string;

    @Column({ name: 'operating_zone_ids', type: 'json', default: () => "'[]'" })
    operatingZoneIds: number[];

    @Column({ name: 'service_type', default: 'last_mile' })
    serviceType: string;

    @Column({ name: 'contact_name', nullable: true })
    contactName: string | null;

    @Column({ name: 'contact_phone', nullable: true })
    contactPhone: string | null;

    @Column({ name: 'contact_email', nullable: true })
    contactEmail: string | null;

    @Column({ name: 'base_fee_vnd', default: 15000 })
    baseFeeVnd: number;

    @Column({ name: 'per_km_fee_vnd', default: 4000 })
    perKmFeeVnd: number;

    @Column({ name: 'per_kg_fee_vnd', default: 1500 })
    perKgFeeVnd: number;

    @Column({ name: 'isActive', default: true })
    isActive: boolean;

    @CreateDateColumn({ name: 'createdAt', type: 'datetime', precision: 3 })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updatedAt', type: 'datetime', precision: 3 })
    updatedAt: Date;

    @ManyToOne(() => Organization, (o) => o.carriers, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'organization_id' })
    organization: Organization;

    @OneToMany(() => Vehicle, (v) => v.carrier)
    vehicles: Vehicle[];

    @OneToMany(() => Order, (o) => o.carrier)
    orders: Order[];

    @OneToMany(() => Route, (r) => r.carrier)
    routes: Route[];

    @OneToMany(() => ShipperProfile, (s) => s.carrier)
    shipperProfiles: ShipperProfile[];

    @OneToMany(() => PlatformApiClient, (p) => p.carrier)
    platformApiClients: PlatformApiClient[];
}
