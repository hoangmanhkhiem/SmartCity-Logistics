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
import { Zone } from './zone.entity';

@Entity('facilities')
export class Facility {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'organization_id' })
    organizationId: number;

    @Column({ name: 'zone_id', nullable: true })
    zoneId: number | null;

    @Column()
    name: string;

    @Column()
    kind: string;

    @Column({ type: 'double' })
    latitude: number;

    @Column({ type: 'double' })
    longitude: number;

    @Column({ nullable: true })
    address: string | null;

    @Column({ nullable: true })
    capacity: number | null;

    @Column({ name: 'opening_time', nullable: true })
    openingTime: string | null;

    @Column({ name: 'closing_time', nullable: true })
    closingTime: string | null;

    @Column({ type: 'text', nullable: true })
    description: string | null;

    @Column({ default: 'secondary' })
    source: string;

    @Column({ default: true })
    verified: boolean;

    @Column({ name: 'isActive', default: true })
    isActive: boolean;

    @CreateDateColumn({ name: 'createdAt', type: 'datetime', precision: 3 })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updatedAt', type: 'datetime', precision: 3 })
    updatedAt: Date;

    @ManyToOne(() => Organization, (o) => o.facilities, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'organization_id' })
    organization: Organization;

    @ManyToOne(() => Zone, (z) => z.facilities)
    @JoinColumn({ name: 'zone_id' })
    zone: Zone | null;

    @OneToMany(() => Charger, (c) => c.facility)
    chargers: Charger[];

    @OneToMany(() => FuelPump, (f) => f.facility)
    fuelPumps: FuelPump[];

    @OneToMany(() => Dock, (d) => d.facility)
    docks: Dock[];
}

@Entity('chargers')
export class Charger {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'facility_id' })
    facilityId: number;

    @Column()
    type: string;

    @Column({ name: 'connector_type', nullable: true })
    connectorType: string | null;

    @Column({ name: 'power_kw', type: 'double' })
    powerKw: number;

    @Column({ default: 1 })
    slots: number;

    @Column({ name: 'price_per_kwh', type: 'double', nullable: true })
    pricePerKwh: number | null;

    @Column({ default: 'available' })
    status: string;

    @Column({ name: 'isActive', default: true })
    isActive: boolean;

    @CreateDateColumn({ name: 'createdAt', type: 'datetime', precision: 3 })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updatedAt', type: 'datetime', precision: 3 })
    updatedAt: Date;

    @ManyToOne(() => Facility, (f) => f.chargers, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'facility_id' })
    facility: Facility;
}

@Entity('fuel_pumps')
export class FuelPump {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'facility_id' })
    facilityId: number;

    @Column({ name: 'fuel_type' })
    fuelType: string;

    @Column({ name: 'price_per_liter', type: 'double', nullable: true })
    pricePerLiter: number | null;

    @Column({ default: 'available' })
    status: string;

    @Column({ name: 'isActive', default: true })
    isActive: boolean;

    @CreateDateColumn({ name: 'createdAt', type: 'datetime', precision: 3 })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updatedAt', type: 'datetime', precision: 3 })
    updatedAt: Date;

    @ManyToOne(() => Facility, (f) => f.fuelPumps, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'facility_id' })
    facility: Facility;
}

@Entity('docks')
export class Dock {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'facility_id' })
    facilityId: number;

    @Column({ nullable: true })
    name: string | null;

    @Column()
    capacity: number;

    @Column({ default: 'available' })
    status: string;

    @Column({ name: 'isActive', default: true })
    isActive: boolean;

    @CreateDateColumn({ name: 'createdAt', type: 'datetime', precision: 3 })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updatedAt', type: 'datetime', precision: 3 })
    updatedAt: Date;

    @ManyToOne(() => Facility, (f) => f.docks, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'facility_id' })
    facility: Facility;
}
