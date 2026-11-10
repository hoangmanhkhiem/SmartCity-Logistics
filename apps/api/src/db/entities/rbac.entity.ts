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
import { User } from './user.entity';
import { Organization } from './organization.entity';

@Entity('roles')
export class Role {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    name: string;

    @Column({ name: 'display_name', nullable: true })
    displayName: string | null;

    @Column({ nullable: true })
    description: string | null;

    @Column({ name: 'is_system', default: false })
    isSystem: boolean;

    @CreateDateColumn({ name: 'createdAt', type: 'datetime', precision: 3 })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updatedAt', type: 'datetime', precision: 3 })
    updatedAt: Date;

    @OneToMany(() => Membership, (m) => m.role)
    memberships: Membership[];

    @OneToMany(() => RolePermission, (rp) => rp.role)
    rolePermissions: RolePermission[];
}

@Entity('permissions')
export class Permission {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    name: string;

    @Column()
    resource: string;

    @Column()
    action: string;

    @Column({ nullable: true })
    description: string | null;

    @CreateDateColumn({ name: 'createdAt', type: 'datetime', precision: 3 })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updatedAt', type: 'datetime', precision: 3 })
    updatedAt: Date;

    @OneToMany(() => RolePermission, (rp) => rp.permission)
    rolePermissions: RolePermission[];
}

@Entity('role_permissions')
export class RolePermission {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'role_id' })
    roleId: number;

    @Column({ name: 'permission_id' })
    permissionId: number;

    @CreateDateColumn({ name: 'createdAt', type: 'datetime', precision: 3 })
    createdAt: Date;

    @ManyToOne(() => Role, (r) => r.rolePermissions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'role_id' })
    role: Role;

    @ManyToOne(() => Permission, (p) => p.rolePermissions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'permission_id' })
    permission: Permission;
}

@Entity('memberships')
export class Membership {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'user_id' })
    userId: number;

    @Column({ name: 'organization_id' })
    organizationId: number;

    @Column({ name: 'role_id' })
    roleId: number;

    @Column({ name: 'is_default', default: false })
    isDefault: boolean;

    @CreateDateColumn({ name: 'createdAt', type: 'datetime', precision: 3 })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updatedAt', type: 'datetime', precision: 3 })
    updatedAt: Date;

    @ManyToOne(() => User, (u) => u.memberships, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => Organization, (o) => o.memberships, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'organization_id' })
    organization: Organization;

    @ManyToOne(() => Role, (r) => r.memberships)
    @JoinColumn({ name: 'role_id' })
    role: Role;
}
