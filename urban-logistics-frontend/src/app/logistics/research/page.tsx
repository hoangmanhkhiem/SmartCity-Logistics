'use client';

import { useState } from 'react';
import { Card, CardBody, CardHeader, DataTable, Badge, Button, Input } from '@/components/ui';
import { Table2, Search, Download, Upload } from 'lucide-react';
import type { Column } from '@/components/ui';

interface Dataset {
    id: string;
    name: string;
    description: string;
    type: 'traffic' | 'emission' | 'delivery' | 'infrastructure';
    records: number;
    lastUpdated: string;
    size: string;
}

export default function ResearchPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [datasets] = useState<Dataset[]>([
        {
            id: '1',
            name: 'Dữ liệu giao thông Q1 2024',
            description: 'Dữ liệu lưu lượng giao thông khu vực nội thành',
            type: 'traffic',
            records: 125000,
            lastUpdated: '2024-03-10',
            size: '45 MB',
        },
        {
            id: '2',
            name: 'Phát thải CO2 theo tuyến',
            description: 'Ước tính phát thải CO2 từ hoạt động vận tải',
            type: 'emission',
            records: 8500,
            lastUpdated: '2024-03-08',
            size: '12 MB',
        },
        {
            id: '3',
            name: 'Thời gian giao hàng trung bình',
            description: 'Phân tích thời gian giao hàng theo khu vực',
            type: 'delivery',
            records: 52000,
            lastUpdated: '2024-03-05',
            size: '28 MB',
        },
        {
            id: '4',
            name: 'Cơ sở hạ tầng logistics',
            description: 'Danh sách và thông số các trạm, kho, hub',
            type: 'infrastructure',
            records: 450,
            lastUpdated: '2024-02-28',
            size: '2 MB',
        },
    ]);

    const columns: Column<Dataset>[] = [
        { key: 'name', header: 'Tên dữ liệu' },
        { key: 'description', header: 'Mô tả' },
        {
            key: 'type',
            header: 'Loại',
            render: (d) => {
                const typeLabels = {
                    traffic: 'Giao thông',
                    emission: 'Phát thải',
                    delivery: 'Giao hàng',
                    infrastructure: 'Hạ tầng',
                };
                const variants = {
                    traffic: 'default',
                    emission: 'warning',
                    delivery: 'default',
                    infrastructure: 'default',
                } as const;
                return <Badge variant={variants[d.type]}>{typeLabels[d.type]}</Badge>;
            },
        },
        {
            key: 'records',
            header: 'Số bản ghi',
            render: (d) => d.records.toLocaleString(),
        },
        { key: 'lastUpdated', header: 'Cập nhật' },
        { key: 'size', header: 'Kích thước' },
        {
            key: 'actions',
            header: '',
            render: () => (
                <Button variant="ghost" size="sm">
                    <Download size={16} />
                </Button>
            ),
        },
    ];

    const filteredDatasets = datasets.filter((d) =>
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Dữ liệu nghiên cứu</h1>
                    <p className="text-gray-500 mt-1">Quản lý và phân tích dữ liệu nghiên cứu</p>
                </div>
                <Button>
                    <Upload size={16} className="mr-2" />
                    Tải lên dữ liệu
                </Button>
            </div>

            <div className="grid grid-cols-4 gap-4">
                <Card>
                    <CardBody className="flex items-center gap-3">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-xl">
                            <Table2 size={24} className="text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{datasets.length}</p>
                            <p className="text-sm text-gray-500">Tổng dataset</p>
                        </div>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="flex items-center gap-3">
                        <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-xl">
                            <Table2 size={24} className="text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">
                                {(datasets.reduce((sum, d) => sum + d.records, 0) / 1000).toFixed(0)}K
                            </p>
                            <p className="text-sm text-gray-500">Tổng bản ghi</p>
                        </div>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="flex items-center gap-3">
                        <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-xl">
                            <Table2 size={24} className="text-purple-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{datasets.filter(d => d.type === 'traffic').length}</p>
                            <p className="text-sm text-gray-500">Giao thông</p>
                        </div>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="flex items-center gap-3">
                        <div className="p-3 bg-orange-100 dark:bg-orange-900/50 rounded-xl">
                            <Table2 size={24} className="text-orange-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{datasets.filter(d => d.type === 'emission').length}</p>
                            <p className="text-sm text-gray-500">Phát thải</p>
                        </div>
                    </CardBody>
                </Card>
            </div>

            <Card>
                <CardBody>
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <Input
                            placeholder="Tìm dataset..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardBody>
            </Card>

            <Card>
                <CardHeader>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Danh sách dữ liệu</h2>
                </CardHeader>
                <CardBody>
                    <DataTable
                        columns={columns}
                        data={filteredDatasets}
                        loading={false}
                        emptyMessage="Chưa có dữ liệu"
                    />
                </CardBody>
            </Card>

            <div className="grid grid-cols-2 gap-4">
                <Card>
                    <CardHeader>
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Thống kê sử dụng</h2>
                    </CardHeader>
                    <CardBody>
                        <div className="h-48 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <p className="text-gray-500">Biểu đồ thống kê sẽ được hiển thị tại đây</p>
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardHeader>
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Dataset phổ biến</h2>
                    </CardHeader>
                    <CardBody>
                        <div className="space-y-3">
                            {datasets.slice(0, 3).map((dataset) => (
                                <div key={dataset.id} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div>
                                        <p className="font-medium">{dataset.name}</p>
                                        <p className="text-sm text-gray-500">{dataset.records.toLocaleString()} bản ghi</p>
                                    </div>
                                    <Button variant="ghost" size="sm">
                                        <Download size={16} />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
}
