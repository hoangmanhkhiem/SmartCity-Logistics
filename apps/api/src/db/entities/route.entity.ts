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
import { Vehicle } from './vehicle.entity';
import { User } from './user.entity';
import { Zone } from './zone.entity';
import { Stop } from './stop.entity';

@Entity('routes')
@Index('routes_carrier_id_shift_date_idx', ['carrierId', 'shiftDate'])
@Index('routes_vehicle_id_shift_date_idx', ['vehicleId', 'shiftDate'])
@Index('routes_shipper_id_shift_date_idx', ['shipperId', 'shiftDate'])
export class Route {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'carrier_id' })
    carrierId: number;

    @Column({ name: 'vehicle_id' })
    vehicleId: number;

    @Column({ name: 'shipper_id' })
    shipperId: number;

    @Column({ name: 'zone_id', nullable: true })
    zoneId: number | null;

    @Column({ unique: true })
    code: string;

    @Column({ name: 'shift_date', type: 'date' })
    shiftDate: Date;

    @Column({ default: 'planned' })
    status: string;

    @Column({ name: 'planned_start_at', type: 'datetime', precision: 3, nullable: true })
    plannedStartAt: Date | null;

    @Column({ name: 'planned_end_at', type: 'datetime', precision: 3, nullable: true })
    plannedEndAt: Date | null;

    @Column({ name: 'actual_start_at', type: 'datetime', precision: 3, nullable: true })
    actualStartAt: Date | null;

    @Column({ name: 'actual_end_at', type: 'datetime', precision: 3, nullable: true })
    actualEndAt: Date | null;

    @Column({ name: 'total_distance_km', type: 'double', nullable: true })
    totalDistanceKm: number | null;

    @Column({ name: 'total_duration_min', nullable: true })
    totalDurationMin: number | null;

    @Column({ name: 'estimated_co2_grams', type: 'double', nullable: true })
    estimatedCo2Grams: number | null;

    @Column({ type: 'text', nullable: true })
    geometry: string | null;

    @Column({ nullable: true })
    notes: string | null;

    @CreateDateColumn({ name: 'createdAt', type: 'datetime', precision: 3 })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updatedAt', type: 'datetime', precision: 3 })
    updatedAt: Date;

    @ManyToOne(() => Carrier, (c) => c.routes, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'carrier_id' })
    carrier: Carrier;

    @ManyToOne(() => Vehicle, (v) => v.routes)
    @JoinColumn({ name: 'vehicle_id' })
    vehicle: Vehicle;

    @ManyToOne(() => User, (u) => u.routesAsShipper)
    @JoinColumn({ name: 'shipper_id' })
    shipper: User;

    @ManyToOne(() => Zone, (z) => z.routes)
    @JoinColumn({ name: 'zone_id' })
    zone: Zone | null;

    @OneToMany(() => Stop, (s) => s.route)
    stops: Stop[];
}
