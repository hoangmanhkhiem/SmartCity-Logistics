'use client';

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Card, CardBody, Badge, Button, Select } from '@/components/ui';
import { shipperApi, vehicleApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { viStatus } from '@/lib/status-labels';
import type { Route, Stop, Vehicle } from '@/types';
import { Package, MapPin, Phone, Truck, PlayCircle, CheckCircle2 } from 'lucide-react';

const Map = dynamic(() => import('@/components/shared/map'), { ssr: false });

const stopStatusVariant: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
    pending: 'default',
    arrived: 'warning',
    completed: 'success',
    failed: 'error',
    skipped: 'default',
};

export default function ShipperTodayPage() {
    const router = useRouter();
    const [route, setRoute] = useState<Route | null>(null);
    const [loading, setLoading] = useState(true);
    const [onShift, setOnShift] = useState<boolean | null>(null);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [vehicleId, setVehicleId] = useState('');
    const [clockingIn, setClockingIn] = useState(false);
    const [busy, setBusy] = useState(false);

    const fetchRoute = useCallback(async () => {
        setLoading(true);
        try {
            const res = await shipperApi.getTodayRoute();
            setRoute(res.data ?? null);
        } catch (e) {
            console.error(e);
            setRoute(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRoute();
        vehicleApi.getAll({ limit: 100 }).then((res) => setVehicles(res.data.data ?? res.data)).catch(() => setVehicles([]));
    }, [fetchRoute]);

    const startRoute = async () => {
        if (!route) return;
        setBusy(true);
        try {
            await shipperApi.startRoute(route.id);
            fetchRoute();
        } catch (e) {
            console.error(e);
        } finally {
            setBusy(false);
        }
    };

    const completeRoute = async () => {
        if (!route) return;
        setBusy(true);
        try {
            await shipperApi.completeRoute(route.id);
            fetchRoute();
        } catch (e) {
            console.error(e);
            alert('Còn điểm dừng chưa xử lý xong — không thể hoàn tất chuyến.');
        } finally {
            setBusy(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-500 text-sm">Đang tải route...</p>
            </div>
        );
    }

    if (!route) {
        return (
            <div className="space-y-4">
                <Card>
                    <CardBody className="text-center py-10 space-y-3">
                        <Truck size={40} className="mx-auto text-slate-300" />
                        <p className="text-slate-600 dark:text-slate-300 font-medium">Chưa có route được gán hôm nay</p>
                        <p className="text-sm text-slate-500">Đợi điều phối viên gom đơn và gán chuyến giao cho bạn.</p>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody className="space-y-3">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Bắt đầu ca làm việc</p>
                        <Select
                            label="Chọn xe"
                            placeholder="Chọn xe của bạn"
                            options={vehicles.map((v) => ({ value: String(v.id), label: `${v.plate} — ${v.type}` }))}
                            value={vehicleId}
                            onChange={setVehicleId}
                        />
                        <p className="text-xs text-slate-400">Sau khi vào ca, điều phối viên có thể gán route cho bạn.</p>
                    </CardBody>
                </Card>
            </div>
        );
    }

    const stops = (route.stops ?? []).slice().sort((a, b) => a.sequence - b.sequence);
    const nextStop = stops.find((s) => s.status === 'pending');
    const totalCod = stops.reduce((sum, s) => sum + (s.codAmountDue ?? 0), 0);
    const allDone = stops.every((s) => ['completed', 'failed', 'skipped'].includes(s.status));

    const markerStops = stops
        .filter((s) => s.latitude != null && s.longitude != null)
        .map((s) => ({
            id: s.id,
            coordinates: [s.longitude, s.latitude] as [number, number],
            sequence: s.sequence,
            type: s.type,
            status: s.status,
            label: s.address ?? undefined,
        }));

    return (
        <div className="space-y-4">
            <Card>
                <CardBody className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-mono text-sm font-semibold text-slate-900 dark:text-white">{route.code}</p>
                            <p className="text-xs text-slate-500">{route.vehicle?.plate}</p>
                        </div>
                        <Badge variant={route.status === 'in_progress' ? 'info' : route.status === 'completed' ? 'success' : 'warning'}>
                            {viStatus(route.status)}
                        </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-2">
                            <p className="text-lg font-bold text-slate-900 dark:text-white">{stops.length}</p>
                            <p className="text-xs text-slate-500">Điểm dừng</p>
                        </div>
                        <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-2">
                            <p className="text-lg font-bold text-slate-900 dark:text-white">{route.totalDistanceKm?.toFixed(1) ?? '—'}</p>
                            <p className="text-xs text-slate-500">km</p>
                        </div>
                        <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-2">
                            <p className="text-lg font-bold text-slate-900 dark:text-white">{formatCurrency(totalCod)}</p>
                            <p className="text-xs text-slate-500">Tổng COD</p>
                        </div>
                    </div>

                    {route.status === 'planned' && (
                        <Button className="w-full" onClick={startRoute} disabled={busy}>
                            <PlayCircle size={18} className="mr-1 inline" /> Bắt đầu chuyến
                        </Button>
                    )}
                    {route.status === 'in_progress' && (
                        <Button className="w-full" variant={allDone ? 'primary' : 'outline'} onClick={completeRoute} disabled={busy || !allDone}>
                            <CheckCircle2 size={18} className="mr-1 inline" /> Hoàn tất chuyến
                        </Button>
                    )}
                </CardBody>
            </Card>

            {markerStops.length > 0 && (
                <Card>
                    <CardBody className="!p-0">
                        <Map stops={markerStops} showZonesAndRestrictions zoom={13} className="h-72" />
                    </CardBody>
                </Card>
            )}

            <div className="space-y-2">
                {stops.map((stop: Stop) => {
                    const isNext = stop.id === nextStop?.id;
                    return (
                        <button
                            key={stop.id}
                            onClick={() => router.push(`/shipper/stops/${stop.id}`)}
                            className={`w-full text-left rounded-xl border p-3 transition-colors ${
                                isNext ? 'border-indigo-400 bg-indigo-50 dark:border-indigo-600 dark:bg-indigo-900/20' : 'border-slate-200 dark:border-slate-700'
                            }`}
                        >
                            <div className="flex items-start gap-3">
                                <div
                                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                                        stop.type === 'pickup' ? 'bg-emerald-600' : 'bg-indigo-600'
                                    }`}
                                >
                                    {stop.sequence}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        {stop.type === 'pickup' ? <Package size={14} className="text-emerald-600" /> : <MapPin size={14} className="text-indigo-600" />}
                                        <span className="text-sm font-medium">{stop.type === 'pickup' ? 'Lấy hàng' : 'Giao hàng'}</span>
                                        <Badge variant={stopStatusVariant[stop.status]} className="text-xs">{viStatus(stop.status)}</Badge>
                                    </div>
                                    <p className="text-sm text-slate-700 dark:text-slate-300 mt-0.5 truncate">{stop.address}</p>
                                    <div className="flex items-center gap-3 mt-1">
                                        {stop.contactPhone && (
                                            <span className="flex items-center gap-1 text-xs text-slate-500">
                                                <Phone size={12} /> {stop.contactPhone}
                                            </span>
                                        )}
                                        {(stop.codAmountDue ?? 0) > 0 && (
                                            <Badge variant={stop.codCollected ? 'success' : 'warning'} className="text-xs">
                                                COD {formatCurrency(stop.codAmountDue!)}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
