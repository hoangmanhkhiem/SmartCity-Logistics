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
import { Telemetry } from './telemetry.entity';
import { Route } from './route.entity';
import { ShipperProfile } from './shipper-profile.entity';

@Entity('vehicles')
export class Vehicle {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'carrier_id' })
    carrierId: number;

    @Column()
    type: string;

    @Column({ unique: true })
    plate: string;

    @Column({ nullable: true })
    brand: string | null;

    @Column({ nullable: true })
    model: string | null;

    @Column({ nullable: true })
    year: number | null;

    @Column({ type: 'double', nullable: true })
    capacity: number | null;

    @Column({ type: 'double', nullable: true })
    volume: number | null;

    @Column({ name: 'fuel_type', nullable: true })
    fuelType: string | null;

    @Column({ name: 'is_electric', default: false })
    isElectric: boolean;

    @Column({ name: 'emission_standard', nullable: true })
    emissionStandard: string | null;

    @Column({ name: 'emission_factor', type: 'double', nullable: true })
    emissionFactor: number | null;

    @Column({ type: 'double', nullable: true })
    range: number | null;

    @Column({ name: 'current_battery_level', type: 'double', nullable: true })
    currentBatteryLevel: number | null;

    @Column({ default: 'available' })
    status: string;

    @Column({ name: 'isActive', default: true })
    isActive: boolean;

    @CreateDateColumn({ name: 'createdAt', type: 'datetime', precision: 3 })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updatedAt', type: 'datetime', precision: 3 })
    updatedAt: Date;

    @ManyToOne(() => Carrier, (c) => c.vehicles, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'carrier_id' })
    carrier: Carrier;

    @OneToMany(() => Telemetry, (t) => t.vehicle)
    telemetries: Telemetry[];

    @OneToMany(() => Route, (r) => r.vehicle)
    routes: Route[];

    @OneToMany(() => ShipperProfile, (s) => s.currentVehicle)
    shipperProfiles: ShipperProfile[];
}
