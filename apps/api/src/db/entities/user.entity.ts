import {
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { Route } from './route.entity';
import { ShipperProfile } from './shipper-profile.entity';
import { Membership } from './rbac.entity';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    email: string;

    @Column()
    password: string;

    @Column()
    name: string;

    @Column({ nullable: true })
    phone: string | null;

    @Column({ name: 'avatar_url', nullable: true })
    avatarUrl: string | null;

    @Column({ name: 'isActive', default: true })
    isActive: boolean;

    @Column({ name: 'last_login_at', type: 'datetime', precision: 3, nullable: true })
    lastLoginAt: Date | null;

    @CreateDateColumn({ name: 'createdAt', type: 'datetime', precision: 3 })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updatedAt', type: 'datetime', precision: 3 })
    updatedAt: Date;

    @OneToMany(() => Membership, (m) => m.user)
    memberships: Membership[];

    @OneToMany(() => Order, (o) => o.customer)
    orders: Order[];

    @OneToMany(() => Route, (r) => r.shipper)
    routesAsShipper: Route[];

    @OneToOne(() => ShipperProfile, (s) => s.user)
    shipperProfile: ShipperProfile;
}
