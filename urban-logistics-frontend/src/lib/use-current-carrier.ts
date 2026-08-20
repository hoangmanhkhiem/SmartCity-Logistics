import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { carrierApi } from '@/lib/api';
import type { Carrier } from '@/types';

/** Carrier gắn với tổ chức (organization) của user carrier-ops hiện tại. */
export function useCurrentCarrier() {
    const { user } = useAuthStore();
    const [carrier, setCarrier] = useState<Carrier | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const organizationId = user?.memberships?.[0]?.organization?.id;
        if (!organizationId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        carrierApi
            .getAll({ organizationId, limit: 1 })
            .then((res) => {
                const list = res.data.data ?? res.data;
                setCarrier(Array.isArray(list) ? list[0] ?? null : null);
            })
            .catch(() => setCarrier(null))
            .finally(() => setLoading(false));
    }, [user?.memberships]);

    return { carrier, loading };
}
