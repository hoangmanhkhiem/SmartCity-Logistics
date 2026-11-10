import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Carrier } from './carrier.entity';
import { Zone } from './zone.entity';
import { Vehicle } from './vehicle.entity';

@Entity('shipper_profiles')
export class ShipperProfile {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'user_id', unique: true })
    userId: number;

    @Column({ name: 'carrier_id' })
    carrierId: number;

    @Column({ name: 'license_number', nullable: true })
    licenseNumber: string | null;

    @Column({ name: 'license_class', nullable: true })
    licenseClass: string | null;

    @Column({ name: 'default_zone_id', nullable: true })
    defaultZoneId: number | null;

    @Column({ name: 'current_vehicle_id', nullable: true })
    currentVehicleId: number | null;

    @Column({ default: 'off_duty' })
    status: string;

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @CreateDateColumn({ name: 'createdAt', type: 'datetime', precision: 3 })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updatedAt', type: 'datetime', precision: 3 })
    updatedAt: Date;

    @OneToOne(() => User, (u) => u.shipperProfile, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => Carrier, (c) => c.shipperProfiles, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'carrier_id' })
    carrier: Carrier;

    @ManyToOne(() => Zone, (z) => z.shipperProfiles)
    @JoinColumn({ name: 'default_zone_id' })
    defaultZone: Zone | null;

    @ManyToOne(() => Vehicle, (v) => v.shipperProfiles)
    @JoinColumn({ name: 'current_vehicle_id' })
    currentVehicle: Vehicle | null;
}
