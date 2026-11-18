'use client';

import { type ReactNode, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getDashboardPath, useAuthStore } from '@/stores/auth-store';
import { canAccessPath, isPublicPath } from '@/lib/route-access';

function useAuthHydrated() {
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        const persist = useAuthStore.persist;
        if (!persist?.hasHydrated) {
            setHydrated(true);
            return;
        }
        if (persist.hasHydrated()) {
            setHydrated(true);
            return;
        }
        return persist.onFinishHydration(() => setHydrated(true));
    }, []);

    return hydrated;
}

export function RouteGuard({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const hydrated = useAuthHydrated();
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const currentRole = useAuthStore((s) => s.currentRole);
    const rawRole = useAuthStore((s) => s.user?.memberships?.[0]?.role?.name);

    const publicPage = isPublicPath(pathname);
    const allowed = canAccessPath(pathname, currentRole, rawRole);

    useEffect(() => {
        if (!hydrated || publicPage) return;
        if (!isAuthenticated || !currentRole) {
            router.replace(`/login?next=${encodeURIComponent(pathname)}`);
            return;
        }
        if (!allowed) {
            router.replace(getDashboardPath(currentRole));
        }
    }, [hydrated, publicPage, isAuthenticated, currentRole, allowed, pathname, router]);

    if (publicPage) return children;
    if (!hydrated) {
        return <div className="min-h-screen bg-[#e7eee9]" aria-busy="true" />;
    }
    if (!isAuthenticated || !allowed) {
        return <div className="min-h-screen bg-[#e7eee9]" aria-busy="true" />;
    }
    return children;
}
