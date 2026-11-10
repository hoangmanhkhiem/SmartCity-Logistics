import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Vehicle } from './vehicle.entity';

@Entity('telemetry')
@Index('telemetry_vehicle_id_timestamp_idx', ['vehicleId', 'timestamp'])
export class Telemetry {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'vehicle_id' })
    vehicleId: number;

    @Column({ type: 'datetime', precision: 3, default: () => 'CURRENT_TIMESTAMP(3)' })
    timestamp: Date;

    @Column({ type: 'double' })
    latitude: number;

    @Column({ type: 'double' })
    longitude: number;

    @Column({ type: 'double', nullable: true })
    speed: number | null;

    @Column({ type: 'double', nullable: true })
    heading: number | null;

    @Column({ type: 'double', nullable: true })
    altitude: number | null;

    @Column({ name: 'battery_level', type: 'double', nullable: true })
    batteryLevel: number | null;

    @Column({ name: 'fuel_level', type: 'double', nullable: true })
    fuelLevel: number | null;

    @Column({ name: 'engine_status', nullable: true })
    engineStatus: string | null;

    @Column({ type: 'double', nullable: true })
    odometer: number | null;

    @CreateDateColumn({ name: 'createdAt', type: 'datetime', precision: 3 })
    createdAt: Date;

    @ManyToOne(() => Vehicle, (v) => v.telemetries, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'vehicle_id' })
    vehicle: Vehicle;
}
