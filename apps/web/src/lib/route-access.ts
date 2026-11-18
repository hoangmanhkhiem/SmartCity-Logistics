import type { UserRole } from '@/stores/auth-store';

const PUBLIC_EXACT = new Set(['/', '/login', '/register', '/cong-khai', '/bao-cao']);

type Rule = {
    prefix: string;
    roles: UserRole[];
    /** Match membership role.name when UserRole collapses several names (e.g. member vs shipper). */
    rawRoles?: string[];
};

/** Longest prefix wins. */
const RULES: Rule[] = [
    { prefix: '/thanh-vien/don-hang', roles: ['shipper'], rawRoles: ['shipper'] },
    { prefix: '/thanh-vien', roles: ['shipper'] },
    { prefix: '/doanh-nghiep', roles: ['carrier_ops'] },
    { prefix: '/studio', roles: ['carrier_ops'] },
    { prefix: '/co-quan', roles: ['regulator'] },
    { prefix: '/nghien-cuu', roles: ['researcher'] },
    { prefix: '/he-thong', roles: ['admin'] },
    { prefix: '/logistics', roles: ['admin'] },
    {
        prefix: '/profile',
        roles: ['admin', 'regulator', 'carrier_ops', 'shipper', 'consumer', 'researcher'],
    },
];

export const ROUTE_RULES: Rule[] = [...RULES].sort((a, b) => b.prefix.length - a.prefix.length);

export function isPublicPath(path: string): boolean {
    if (PUBLIC_EXACT.has(path)) return true;
    return path.startsWith('/cong-khai/');
}

function matchRule(path: string): Rule | undefined {
    return ROUTE_RULES.find((rule) => path === rule.prefix || path.startsWith(`${rule.prefix}/`));
}

export function canAccessPath(path: string, role: UserRole | null, rawRole?: string | null): boolean {
    if (isPublicPath(path)) return true;
    if (!role) return false;
    const rule = matchRule(path);
    if (!rule) return false;
    if (!rule.roles.includes(role)) return false;
    if (rule.rawRoles && !rule.rawRoles.includes(rawRole || '')) return false;
    return true;
}
