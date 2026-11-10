import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredRoles) {
            return true;
        }

        const { user } = context.switchToHttp().getRequest();

        if (!user || !user.memberships) {
            return false;
        }

        const expands = (role: string): string[] => {
            const aliases: Record<string, string[]> = {
                admin: ['platform_admin', 'sys_admin'],
                sys_admin: ['platform_admin', 'sys_admin'],
                platform_admin: ['sys_admin', 'platform_admin'],
                carrier_mgr: ['carrier_ops', 'org_admin', 'platform_admin', 'sys_admin'],
                org_admin: ['org_admin', 'carrier_ops'],
                dispatcher: ['carrier_ops', 'org_staff'],
                org_staff: ['org_staff', 'carrier_ops'],
                member: ['shipper', 'consumer', 'member'],
                researcher: ['researcher', 'platform_admin', 'sys_admin'],
            };
            return [role, ...(aliases[role] ?? [])];
        };
        const allowed = new Set(requiredRoles.flatMap(expands));

        return user.memberships.some((membership: { role: { name: string } }) =>
            allowed.has(membership.role.name),
        );
    }
}
