'use client';

import { Card, CardBody, CardHeader } from '@/components/ui';
import { Building2, Truck, Leaf, AlertTriangle, TrendingDown, MapPin, BarChart3 } from 'lucide-react';

export default function RegulatorDashboard() {
    const kpis = [
        { label: 'Tổng đơn vị vận tải', value: '45', icon: <Truck size={24} />, color: 'text-blue-500', bg: 'bg-blue-500/10', change: '+5%' },
        { label: 'CO₂ tiết kiệm (tấn)', value: '1,250', icon: <Leaf size={24} />, color: 'text-green-500', bg: 'bg-green-500/10', change: '-12%' },
        { label: 'Vùng LEZ hoạt động', value: '8', icon: <MapPin size={24} />, color: 'text-purple-500', bg: 'bg-purple-500/10', change: '+2' },
        { label: 'Vi phạm tháng này', value: '23', icon: <AlertTriangle size={24} />, color: 'text-red-500', bg: 'bg-red-500/10', change: '-8%' },
    ];

    const emissionData = [
        { month: 'T1', co2: 450 },
        { month: 'T2', co2: 420 },
        { month: 'T3', co2: 380 },
        { month: 'T4', co2: 350 },
        { month: 'T5', co2: 320 },
        { month: 'T6', co2: 290 },
    ];

    const topCarriers = [
        { name: 'GHN Express', vehicles: 120, compliance: 98, co2: 45 },
        { name: 'GHTK', vehicles: 95, compliance: 95, co2: 38 },
        { name: 'Shopee Express', vehicles: 80, compliance: 92, co2: 32 },
        { name: 'J&T Express', vehicles: 65, compliance: 89, co2: 28 },
    ];

    const zones = [
        { name: 'Hoàn Kiếm LEZ', type: 'Low Emission Zone', status: 'active', vehicles: 45 },
        { name: 'Ba Đình', type: 'Restricted Hours', status: 'active', vehicles: 120 },
        { name: 'Đống Đa', type: 'Weight Limit', status: 'active', vehicles: 89 },
    ];

    return (
        <div className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map((kpi, i) => (
                    <Card key={i}>
                        <CardBody className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl ${kpi.bg} ${kpi.color}`}>{kpi.icon}</div>
                            <div className="flex-1">
                                <p className="text-2xl font-bold text-gray-800 dark:text-white">{kpi.value}</p>
                                <p className="text-sm text-gray-500">{kpi.label}</p>
                            </div>
                            <span className={`text-sm font-medium ${kpi.change.startsWith('-') ? 'text-green-500' : 'text-blue-500'}`}>
                                {kpi.change}
                            </span>
                        </CardBody>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Emission Chart placeholder */}
                <Card>
                    <CardHeader className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Xu hướng phát thải CO₂</h2>
                        <TrendingDown size={20} className="text-green-500" />
                    </CardHeader>
                    <CardBody>
                        <div className="h-64 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex items-center justify-center">
                            <div className="text-center">
                                <BarChart3 size={48} className="mx-auto mb-2 text-gray-400" />
                                <p className="text-gray-500">Biểu đồ phát thải CO₂</p>
                                <p className="text-sm text-gray-400">Xu hướng giảm dần qua các tháng</p>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                {/* Top Carriers */}
                <Card>
                    <CardHeader>
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Đơn vị vận tải hàng đầu</h2>
                    </CardHeader>
                    <CardBody>
                        <div className="space-y-3">
                            {topCarriers.map((carrier, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                            {i + 1}
                                        </span>
                                        <div>
                                            <p className="font-medium text-gray-800 dark:text-white">{carrier.name}</p>
                                            <p className="text-sm text-gray-500">{carrier.vehicles} xe</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-green-600">{carrier.compliance}% tuân thủ</p>
                                        <p className="text-xs text-gray-400">{carrier.co2} tấn CO₂/tháng</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Active Zones */}
            <Card>
                <CardHeader>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Vùng quản lý hoạt động</h2>
                </CardHeader>
                <CardBody>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {zones.map((zone, i) => (
                            <div key={i} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-medium text-gray-800 dark:text-white">{zone.name}</h3>
                                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Hoạt động</span>
                                </div>
                                <p className="text-sm text-gray-500 mb-2">{zone.type}</p>
                                <p className="text-sm"><span className="font-medium">{zone.vehicles}</span> xe đang hoạt động</p>
                            </div>
                        ))}
                    </div>
                </CardBody>
            </Card>
        </div>
    );
}
