'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardBody, CardHeader } from '@/components/ui';
import { Truck, Leaf, AlertTriangle, MapPin } from 'lucide-react';
import { analyticsApi, zoneApi, carrierApi } from '@/lib/api';
import { Zone, Carrier } from '@/types';

const MapView = dynamic(() => import('@/components/shared/map'), {
    ssr: false,
    loading: () => (
        <div className="h-80 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
            <div className="flex items-center gap-2 text-slate-500">
                <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                Đang tải bản đồ...
            </div>
        </div>
    ),
});

type PlatformSummary = {
    orders?: { total?: number; byStatus?: Record<string, number> };
    vehicles?: { byStatus?: Record<string, number> };
    routes?: { byStatus?: Record<string, number> };
    environment?: { estimatedCo2GramsTotal?: number };
    operations?: { unassignedOrders?: number };
};

export default function RegulatorDashboard() {
    const [zones, setZones] = useState<Zone[]>([]);
    const [carriers, setCarriers] = useState<Carrier[]>([]);
    const [summary, setSummary] = useState<PlatformSummary | null>(null);

    useEffect(() => {
        zoneApi.getAll({ limit: 50 }).then((res) => setZones(res.data.data ?? res.data)).catch((e) => console.error(e));
        carrierApi.getAll({ limit: 50 }).then((res) => setCarriers(res.data.data ?? res.data)).catch((e) => console.error(e));
        analyticsApi.getPlatformSummary().then((res) => setSummary(res.data)).catch((e) => console.error(e));
    }, []);

    const vehicleTotal = Object.values(summary?.vehicles?.byStatus ?? {}).reduce((a, b) => a + b, 0);
    const lezZones = zones.filter((z) => z.type === 'lez').length;
    const co2Tons = summary?.environment?.estimatedCo2GramsTotal ? (summary.environment.estimatedCo2GramsTotal / 1_000_000).toFixed(2) : '0';

    const kpis = [
        { label: 'Tổng phương tiện (toàn TP)', value: String(vehicleTotal), icon: <Truck size={24} />, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
        { label: 'Phát thải CO₂ (tấn)', value: co2Tons, icon: <Leaf size={24} />, color: 'text-green-500', bg: 'bg-green-500/10' },
        { label: 'Vùng LEZ hoạt động', value: String(lezZones), icon: <MapPin size={24} />, color: 'text-purple-500', bg: 'bg-purple-500/10' },
        { label: 'Đơn chờ điều phối', value: String(summary?.operations?.unassignedOrders ?? 0), icon: <AlertTriangle size={24} />, color: 'text-red-500', bg: 'bg-red-500/10' },
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map((kpi, i) => (
                    <Card key={i}>
                        <CardBody className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl ${kpi.bg} ${kpi.color}`}>{kpi.icon}</div>
                            <div>
                                <p className="text-2xl font-bold text-slate-800 dark:text-white">{kpi.value}</p>
                                <p className="text-sm text-slate-500">{kpi.label}</p>
                            </div>
                        </CardBody>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Bản đồ khu vực & LEZ</h2>
                    </CardHeader>
                    <CardBody>
                        <div className="h-64">
                            <MapView center={[105.8542, 21.0285]} zoom={11} markers={[]} showZonesAndRestrictions />
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardHeader>
                        <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Carrier đăng ký trên nền tảng</h2>
                    </CardHeader>
                    <CardBody>
                        {carriers.length === 0 ? (
                            <p className="text-sm text-slate-500">Chưa có carrier nào</p>
                        ) : (
                            <div className="space-y-3">
                                {carriers.slice(0, 6).map((c, i) => (
                                    <div key={c.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <span className="w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                                {i + 1}
                                            </span>
                                            <div>
                                                <p className="font-medium text-slate-800 dark:text-white">{c.name}</p>
                                                <p className="text-sm text-slate-500">{(c.operatingZoneIds ?? []).length} khu vực phục vụ</p>
                                            </div>
                                        </div>
                                        <span className={`px-2 py-1 text-xs rounded-full ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                                            {c.isActive ? 'Hoạt động' : 'Ngưng'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardBody>
                </Card>
            </div>

            <Card>
                <CardHeader className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Vùng quản lý hoạt động</h2>
                    <span className="text-sm text-slate-500">{zones.length} vùng</span>
                </CardHeader>
                <CardBody>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {zones.slice(0, 6).map((zone) => (
                            <div key={zone.id} className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-medium text-slate-800 dark:text-white">{zone.name}</h3>
                                    <span className={`px-2 py-1 text-xs rounded-full ${zone.type === 'lez' ? 'bg-green-100 text-green-700' : zone.type === 'restricted' ? 'bg-red-100 text-red-700' : 'bg-indigo-100 text-indigo-700'}`}>
                                        {zone.type === 'lez' ? 'LEZ' : zone.type === 'restricted' ? 'Hạn chế' : 'Quận'}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-500">{zone.description || zone.type}</p>
                            </div>
                        ))}
                    </div>
                </CardBody>
            </Card>
        </div>
    );
}
