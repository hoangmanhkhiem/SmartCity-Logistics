'use client';

import { Card, CardBody, CardHeader } from '@/components/ui';
import { Building2, Truck, Route, Users, Package, Warehouse, Zap, Fuel } from 'lucide-react';

export default function LogisticsDashboard() {
    const stats = [
        { label: 'Cơ sở hoạt động', value: '12', icon: <Building2 size={24} />, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { label: 'Đội xe', value: '85', icon: <Truck size={24} />, color: 'text-purple-500', bg: 'bg-purple-500/10' },
        { label: 'Tuyến đường', value: '34', icon: <Route size={24} />, color: 'text-green-500', bg: 'bg-green-500/10' },
        { label: 'Nhân viên', value: '156', icon: <Users size={24} />, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    ];

    const facilities = [
        { name: 'Hub Cầu Giấy', type: 'hub', capacity: 500, usage: 78, icon: <Warehouse size={20} /> },
        { name: 'Kho Thanh Xuân', type: 'warehouse', capacity: 1000, usage: 65, icon: <Package size={20} /> },
        { name: 'Trạm sạc Đống Đa', type: 'charging', capacity: 20, usage: 90, icon: <Zap size={20} /> },
        { name: 'Trạm xăng Ba Đình', type: 'fuel', capacity: 50, usage: 45, icon: <Fuel size={20} /> },
    ];

    const vehicles = [
        { type: 'Xe máy', total: 40, active: 35, electric: 15 },
        { type: 'Xe tải nhỏ', total: 25, active: 20, electric: 8 },
        { type: 'Xe tải lớn', total: 15, active: 12, electric: 3 },
        { type: 'Xe điện', total: 5, active: 5, electric: 5 },
    ];

    return (
        <div className="space-y-6">
            {/* Organization info */}
            <Card className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-0">
                <CardBody className="p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                            <Building2 size={32} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Công ty TNHH Logistics ABC</h1>
                            <p className="text-indigo-200">Quản lý vận tải và kho bãi</p>
                        </div>
                    </div>
                </CardBody>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <Card key={i}>
                        <CardBody className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>{stat.icon}</div>
                            <div>
                                <p className="text-2xl font-bold text-gray-800 dark:text-white">{stat.value}</p>
                                <p className="text-sm text-gray-500">{stat.label}</p>
                            </div>
                        </CardBody>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Facilities */}
                <Card>
                    <CardHeader>
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Cơ sở logistics</h2>
                    </CardHeader>
                    <CardBody>
                        <div className="space-y-3">
                            {facilities.map((facility, i) => (
                                <div key={i} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-500">{facility.icon}</span>
                                            <span className="font-medium text-gray-800 dark:text-white">{facility.name}</span>
                                        </div>
                                        <span className="text-sm text-gray-500">{facility.usage}% sử dụng</span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full ${facility.usage > 80 ? 'bg-red-500' : facility.usage > 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                            style={{ width: `${facility.usage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardBody>
                </Card>

                {/* Fleet */}
                <Card>
                    <CardHeader>
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Đội xe</h2>
                    </CardHeader>
                    <CardBody>
                        <div className="space-y-3">
                            {vehicles.map((v, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <Truck size={20} className="text-gray-500" />
                                        <span className="font-medium text-gray-800 dark:text-white">{v.type}</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm">
                                        <span className="text-green-600">{v.active} hoạt động</span>
                                        <span className="text-blue-600">{v.electric} điện</span>
                                        <span className="text-gray-400">/ {v.total}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
}
