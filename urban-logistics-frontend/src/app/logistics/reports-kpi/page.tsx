'use client';

import { useState } from 'react';
import { Card, CardBody, CardHeader, Button, Badge } from '@/components/ui';
import { BarChart3, TrendingUp, TrendingDown, Download, Calendar } from 'lucide-react';

export default function ReportsKPIPage() {
    const [dateRange, setDateRange] = useState('7days');

    const kpiData = {
        totalOrders: { value: 1245, change: 12.5, trend: 'up' },
        deliveryRate: { value: 98.2, change: 2.1, trend: 'up' },
        avgDeliveryTime: { value: 45, change: -8.3, trend: 'up' },
        customerSatisfaction: { value: 4.6, change: 5.2, trend: 'up' },
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Báo cáo & KPI</h1>
                    <p className="text-gray-500 mt-1">Theo dõi hiệu suất và chỉ số quan trọng</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <Calendar size={16} className="mr-2" />
                        Chọn thời gian
                    </Button>
                    <Button>
                        <Download size={16} className="mr-2" />
                        Xuất báo cáo
                    </Button>
                </div>
            </div>

            <div className="flex gap-2">
                {[
                    { value: '7days', label: '7 ngày' },
                    { value: '30days', label: '30 ngày' },
                    { value: '90days', label: '90 ngày' },
                    { value: 'custom', label: 'Tùy chỉnh' },
                ].map((option) => (
                    <button
                        key={option.value}
                        onClick={() => setDateRange(option.value)}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                            dateRange === option.value
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200'
                        }`}
                    >
                        {option.label}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-4 gap-4">
                <Card>
                    <CardBody>
                        <div className="flex justify-between items-start mb-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                                <BarChart3 size={20} className="text-blue-600" />
                            </div>
                            <Badge variant={kpiData.totalOrders.trend === 'up' ? 'success' : 'error'}>
                                {kpiData.totalOrders.trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                {kpiData.totalOrders.change}%
                            </Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Tổng đơn hàng</p>
                        <p className="text-2xl font-bold mt-1">{kpiData.totalOrders.value.toLocaleString()}</p>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody>
                        <div className="flex justify-between items-start mb-3">
                            <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                                <TrendingUp size={20} className="text-green-600" />
                            </div>
                            <Badge variant="success">
                                <TrendingUp size={14} />
                                {kpiData.deliveryRate.change}%
                            </Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Tỷ lệ giao thành công</p>
                        <p className="text-2xl font-bold mt-1">{kpiData.deliveryRate.value}%</p>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody>
                        <div className="flex justify-between items-start mb-3">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                                <BarChart3 size={20} className="text-purple-600" />
                            </div>
                            <Badge variant="success">
                                <TrendingDown size={14} />
                                {Math.abs(kpiData.avgDeliveryTime.change)}%
                            </Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Thời gian TB</p>
                        <p className="text-2xl font-bold mt-1">{kpiData.avgDeliveryTime.value} phút</p>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody>
                        <div className="flex justify-between items-start mb-3">
                            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg">
                                <BarChart3 size={20} className="text-yellow-600" />
                            </div>
                            <Badge variant="success">
                                <TrendingUp size={14} />
                                {kpiData.customerSatisfaction.change}%
                            </Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Hài lòng khách hàng</p>
                        <p className="text-2xl font-bold mt-1">{kpiData.customerSatisfaction.value}/5.0</p>
                    </CardBody>
                </Card>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Card>
                    <CardHeader>
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Đơn hàng theo ngày</h2>
                    </CardHeader>
                    <CardBody>
                        <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <p className="text-gray-500">Biểu đồ cột sẽ được hiển thị tại đây</p>
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardHeader>
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Phân bố trạng thái</h2>
                    </CardHeader>
                    <CardBody>
                        <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <p className="text-gray-500">Biểu đồ tròn sẽ được hiển thị tại đây</p>
                        </div>
                    </CardBody>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Hiệu suất tài xế</h2>
                </CardHeader>
                <CardBody>
                    <div className="space-y-3">
                        {[
                            { name: 'Nguyễn Văn A', orders: 45, rating: 4.8, onTime: 98 },
                            { name: 'Trần Văn B', orders: 42, rating: 4.7, onTime: 96 },
                            { name: 'Lê Thị C', orders: 38, rating: 4.9, onTime: 99 },
                        ].map((driver, i) => (
                            <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                                        {driver.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-medium">{driver.name}</p>
                                        <p className="text-sm text-gray-500">{driver.orders} đơn</p>
                                    </div>
                                </div>
                                <div className="flex gap-6">
                                    <div className="text-center">
                                        <p className="text-sm text-gray-500">Đánh giá</p>
                                        <p className="font-bold text-yellow-600">{driver.rating}/5.0</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm text-gray-500">Đúng giờ</p>
                                        <p className="font-bold text-green-600">{driver.onTime}%</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardBody>
            </Card>
        </div>
    );
}
