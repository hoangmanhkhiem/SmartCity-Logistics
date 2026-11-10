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
import { Facility } from './facility.entity';
import { Order } from './order.entity';
import { Route } from './route.entity';
import { ShipperProfile } from './shipper-profile.entity';

@Entity('zones')
export class Zone {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({ nullable: true })
    type: string | null;

    @Column({ type: 'text', nullable: true })
    description: string | null;

    @Column({ type: 'text', nullable: true })
    boundary: string | null;

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

    @OneToMany(() => Facility, (f) => f.zone)
    facilities: Facility[];

    @OneToMany(() => RoadSegment, (r) => r.zone)
    roadSegments: RoadSegment[];

    @OneToMany(() => Restriction, (r) => r.zone)
    restrictions: Restriction[];

    @OneToMany(() => Order, (o) => o.zone)
    orders: Order[];

    @OneToMany(() => Route, (r) => r.zone)
    routes: Route[];

    @OneToMany(() => ShipperProfile, (s) => s.defaultZone)
    shipperProfiles: ShipperProfile[];
}

@Entity('road_segments')
export class RoadSegment {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'zone_id', nullable: true })
    zoneId: number | null;

    @Column()
    name: string;

    @Column({ name: 'osm_id', nullable: true })
    osmId: string | null;

    @Column({ type: 'text', nullable: true })
    geometry: string | null;

    @Column({ name: 'one_way', default: false })
    oneWay: boolean;

    @Column({ name: 'speed_limit', type: 'double', nullable: true })
    speedLimit: number | null;

    @Column({ nullable: true })
    lanes: number | null;

    @Column({ name: 'road_type', nullable: true })
    roadType: string | null;

    @Column({ name: 'isActive', default: true })
    isActive: boolean;

    @CreateDateColumn({ name: 'createdAt', type: 'datetime', precision: 3 })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updatedAt', type: 'datetime', precision: 3 })
    updatedAt: Date;

    @ManyToOne(() => Zone, (z) => z.roadSegments)
    @JoinColumn({ name: 'zone_id' })
    zone: Zone | null;

    @OneToMany(() => Restriction, (r) => r.roadSegment)
    restrictions: Restriction[];
}

@Entity('restrictions')
export class Restriction {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'road_segment_id', nullable: true })
    roadSegmentId: number | null;

    @Column({ name: 'zone_id', nullable: true })
    zoneId: number | null;

    @Column({ name: 'vehicle_type', nullable: true })
    vehicleType: string | null;

    @Column({ name: 'vehicle_types', type: 'json', default: () => "'[]'" })
    vehicleTypes: string[];

    @Column({ default: 'restricted' })
    severity: string;

    @Column({ name: 'max_weight', type: 'double', nullable: true })
    maxWeight: number | null;

    @Column({ name: 'max_height', type: 'double', nullable: true })
    maxHeight: number | null;

    @Column({ name: 'time_from', nullable: true })
    timeFrom: string | null;

    @Column({ name: 'time_to', nullable: true })
    timeTo: string | null;

    @Column({ name: 'days_of_week', type: 'json' })
    daysOfWeek: string[];

    @Column({ default: false })
    allowed: boolean;

    @Column({ type: 'text', nullable: true })
    description: string | null;

    @Column({ default: 'regulation' })
    source: string;

    @Column({ default: true })
    verified: boolean;

    @Column({ name: 'isActive', default: true })
    isActive: boolean;

    @CreateDateColumn({ name: 'createdAt', type: 'datetime', precision: 3 })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updatedAt', type: 'datetime', precision: 3 })
    updatedAt: Date;

    @ManyToOne(() => RoadSegment, (rs) => rs.restrictions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'road_segment_id' })
    roadSegment: RoadSegment | null;

    @ManyToOne(() => Zone, (z) => z.restrictions)
    @JoinColumn({ name: 'zone_id' })
    zone: Zone | null;
}
