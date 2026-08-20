'use client';

import { useEffect, useState } from 'react';
import { Card, CardBody, Badge } from '@/components/ui';
import { routeApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { formatDate, formatCurrency } from '@/lib/utils';
import { viStatus } from '@/lib/status-labels';
import type { Route } from '@/types';
import { Route as RouteIcon, MapPin } from 'lucide-react';

export default function ShipperHistoryPage() {
    const { user } = useAuthStore();
    const [routes, setRoutes] = useState<Route[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        routeApi.getAll({ shipperId: user.id, limit: 30 }).then((res) => {
            setRoutes(res.data.data ?? res.data);
        }).catch((e) => console.error(e)).finally(() => setLoading(false));
    }, [user]);

    if (loading) {
        return <div className="py-24 text-center text-slate-500">Đang tải...</div>;
    }

    if (!routes.length) {
        return (
            <Card>
                <CardBody className="text-center py-10">
                    <RouteIcon size={40} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-slate-500">Chưa có lịch sử chuyến giao nào</p>
                </CardBody>
            </Card>
        );
    }

    return (
        <div className="space-y-3">
            {routes.map((r) => {
                const codTotal = (r.stops ?? []).reduce((s, st) => s + (st.codAmountCollected ?? 0), 0);
                return (
                    <Card key={r.id}>
                        <CardBody className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="font-mono text-sm font-semibold">{r.code}</span>
                                <Badge variant={r.status === 'completed' ? 'success' : r.status === 'cancelled' ? 'error' : 'default'}>
                                    {viStatus(r.status)}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-slate-500">
                                <MapPin size={12} /> {formatDate(r.shiftDate)} · {r.zone?.name ?? 'Không rõ khu vực'}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-300">
                                <span>{r.stops?.length ?? 0} điểm dừng</span>
                                {r.totalDistanceKm != null && <span>{r.totalDistanceKm.toFixed(1)} km</span>}
                                {codTotal > 0 && <span>COD: {formatCurrency(codTotal)}</span>}
                            </div>
                        </CardBody>
                    </Card>
                );
            })}
        </div>
    );
}
