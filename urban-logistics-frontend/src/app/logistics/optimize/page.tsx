'use client';

import { useState } from 'react';
import { Card, CardBody, CardHeader, Button, Badge } from '@/components/ui';
import { Route, Play, Settings, Download } from 'lucide-react';

export default function OptimizePage() {
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleOptimize = () => {
        setIsOptimizing(true);
        setTimeout(() => {
            setResult({
                totalDistance: 125.5,
                totalTime: 180,
                fuelSaved: 15,
                co2Reduced: 25,
                routes: 5,
            });
            setIsOptimizing(false);
        }, 3000);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Tối ưu tuyến đường</h1>
                <p className="text-gray-500 mt-1">Tối ưu hóa tuyến đường giao hàng</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Card>
                    <CardHeader>
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Cấu hình tối ưu</h2>
                    </CardHeader>
                    <CardBody className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Số đơn hàng</label>
                            <input
                                type="number"
                                className="w-full px-3 py-2 border rounded-lg"
                                placeholder="50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Số xe khả dụng</label>
                            <input
                                type="number"
                                className="w-full px-3 py-2 border rounded-lg"
                                placeholder="10"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Thời gian tối đa (phút)</label>
                            <input
                                type="number"
                                className="w-full px-3 py-2 border rounded-lg"
                                placeholder="240"
                            />
                        </div>
                        <Button
                            className="w-full"
                            onClick={handleOptimize}
                            disabled={isOptimizing}
                        >
                            {isOptimizing ? (
                                <>Đang tối ưu...</>
                            ) : (
                                <>
                                    <Play size={16} className="mr-2" />
                                    Bắt đầu tối ưu
                                </>
                            )}
                        </Button>
                    </CardBody>
                </Card>

                <Card>
                    <CardHeader>
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Kết quả tối ưu</h2>
                    </CardHeader>
                    <CardBody>
                        {!result ? (
                            <div className="text-center py-12 text-gray-500">
                                Chưa có kết quả. Nhấn "Bắt đầu tối ưu" để chạy.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Tổng quãng đường</p>
                                        <p className="text-2xl font-bold text-blue-600">{result.totalDistance} km</p>
                                    </div>
                                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Thời gian</p>
                                        <p className="text-2xl font-bold text-purple-600">{result.totalTime} phút</p>
                                    </div>
                                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Tiết kiệm nhiên liệu</p>
                                        <p className="text-2xl font-bold text-green-600">{result.fuelSaved}%</p>
                                    </div>
                                    <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Giảm CO₂</p>
                                        <p className="text-2xl font-bold text-orange-600">{result.co2Reduced}%</p>
                                    </div>
                                </div>
                                <Button className="w-full" variant="outline">
                                    <Download size={16} className="mr-2" />
                                    Tải báo cáo
                                </Button>
                            </div>
                        )}
                    </CardBody>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Lịch sử tối ưu</h2>
                </CardHeader>
                <CardBody>
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
                                        <Route size={20} className="text-indigo-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium">Tối ưu #{i}</p>
                                        <p className="text-sm text-gray-500">2024-03-{10 + i} 14:30</p>
                                    </div>
                                </div>
                                <Badge variant="success">Hoàn thành</Badge>
                            </div>
                        ))}
                    </div>
                </CardBody>
            </Card>
        </div>
    );
}
