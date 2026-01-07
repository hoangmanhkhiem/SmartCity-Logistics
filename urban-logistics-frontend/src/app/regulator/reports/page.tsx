'use client';

import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, Badge } from '@/components/ui';
import { orderApi, vehicleApi, carrierApi } from '@/lib/api';
import { BarChart3, TrendingDown, Leaf, Truck, Package, Building2 } from 'lucide-react';

export default function RegulatorReportsPage() {
    const [stats, setStats] = useState({ orders: 0, vehicles: 0, carriers: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [orders, vehicles, carriers] = await Promise.all([
                    orderApi.getAll({ limit: 1 }),
                    vehicleApi.getAll({ limit: 1 }),
                    carrierApi.getAll({ limit: 1 }),
                ]);
                setStats({
                    orders: orders.data.meta?.total || orders.data.length || 0,
                    vehicles: vehicles.data.meta?.total || vehicles.data.length || 0,
                    carriers: carriers.data.meta?.total || carriers.data.length || 0,
                });
            } catch (error) {
                console.error('Failed to fetch stats:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const kpis = [
        { label: 'Tổng đơn hàng', value: stats.orders, icon: <Package size={24} />, color: 'text-blue-500', bg: 'bg-blue-100' },
        { label: 'Tổng phương tiện', value: stats.vehicles, icon: <Truck size={24} />, color: 'text-purple-500', bg: 'bg-purple-100' },
        { label: 'Đơn vị vận tải', value: stats.carriers, icon: <Building2 size={24} />, color: 'text-green-500', bg: 'bg-green-100' },
        { label: 'CO₂ tiết kiệm (tấn)', value: '1,250', icon: <Leaf size={24} />, color: 'text-teal-500', bg: 'bg-teal-100' },
    ];

    const monthlyData = [
        { month: 'T1', orders: 450, co2: 45 },
        { month: 'T2', orders: 520, co2: 42 },
        { month: 'T3', orders: 680, co2: 38 },
        { month: 'T4', orders: 750, co2: 35 },
        { month: 'T5', orders: 890, co2: 32 },
        { month: 'T6', orders: 1020, co2: 29 },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Báo cáo & Thống kê</h1>
                <p className="text-gray-500 mt-1">Phân tích dữ liệu logistics đô thị</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {kpis.map((kpi, i) => (
                    <Card key={i}>
                        <CardBody className="flex items-center gap-3">
                            <div className={`p-3 ${kpi.bg} rounded-xl ${kpi.color}`}>{kpi.icon}</div>
                            <div>
                                <p className="text-2xl font-bold text-gray-800 dark:text-white">{loading ? '...' : kpi.value}</p>
                                <p className="text-sm text-gray-500">{kpi.label}</p>
                            </div>
                        </CardBody>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Xu hướng đơn hàng</h2>
                        <BarChart3 size={20} className="text-gray-400" />
                    </CardHeader>
                    <CardBody>
                        <div className="h-64 flex items-end justify-between gap-2">
                            {monthlyData.map((d, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center">
                                    <div className="w-full bg-blue-500 rounded-t" style={{ height: `${(d.orders / 1100) * 200}px` }}></div>
                                    <span className="text-xs text-gray-500 mt-2">{d.month}</span>
                                </div>
                            ))}
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardHeader className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Xu hướng CO₂</h2>
                        <TrendingDown size={20} className="text-green-500" />
                    </CardHeader>
                    <CardBody>
                        <div className="h-64 flex items-end justify-between gap-2">
                            {monthlyData.map((d, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center">
                                    <div className="w-full bg-green-500 rounded-t" style={{ height: `${(d.co2 / 50) * 200}px` }}></div>
                                    <span className="text-xs text-gray-500 mt-2">{d.month}</span>
                                </div>
                            ))}
                        </div>
                        <p className="text-center text-sm text-green-600 mt-4">↓ Giảm 35% so với đầu năm</p>
                    </CardBody>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <h2 className="text-lg font-semibold">Tóm tắt hiệu suất</h2>
                </CardHeader>
                <CardBody>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center">
                            <p className="text-3xl font-bold text-blue-600">98.5%</p>
                            <p className="text-sm text-gray-500 mt-1">Tỷ lệ giao thành công</p>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center">
                            <p className="text-3xl font-bold text-green-600">45 phút</p>
                            <p className="text-sm text-gray-500 mt-1">Thời gian giao TB</p>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center">
                            <p className="text-3xl font-bold text-purple-600">92%</p>
                            <p className="text-sm text-gray-500 mt-1">Tuân thủ LEZ</p>
                        </div>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
}
