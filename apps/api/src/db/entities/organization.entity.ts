import {
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Carrier } from './carrier.entity';
import { Facility } from './facility.entity';
import { Membership } from './rbac.entity';

@Entity('organizations')
export class Organization {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    type: string;

    @Column({ nullable: true })
    business: string | null;

    @Column({ type: 'text', nullable: true })
    description: string | null;

    @Column({ nullable: true })
    address: string | null;

    @Column({ nullable: true })
    phone: string | null;

    @Column({ nullable: true })
    email: string | null;

    @Column({ nullable: true })
    website: string | null;

    @Column({ name: 'logo_url', nullable: true })
    logoUrl: string | null;

    @Column({ name: 'isActive', default: true })
    isActive: boolean;

    @Column({ name: 'is_partner', default: false })
    isPartner: boolean;

    @Column({ name: 'anonymize_public', default: true })
    anonymizePublic: boolean;

    @Column({ name: 'fleet_size', type: 'int', nullable: true })
    fleetSize: number | null;

    @CreateDateColumn({ name: 'createdAt', type: 'datetime', precision: 3 })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updatedAt', type: 'datetime', precision: 3 })
    updatedAt: Date;

    @OneToMany(() => Carrier, (c) => c.organization)
    carriers: Carrier[];

    @OneToMany(() => Facility, (f) => f.organization)
    facilities: Facility[];

    @OneToMany(() => Membership, (m) => m.organization)
    memberships: Membership[];
}
