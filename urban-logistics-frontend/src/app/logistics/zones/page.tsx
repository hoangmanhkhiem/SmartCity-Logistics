'use client';

import { useState } from 'react';
import { Card, CardBody, CardHeader, DataTable, Badge, Button, Input } from '@/components/ui';
import { Map, Search, Plus } from 'lucide-react';
import type { Column } from '@/components/ui';

interface Zone {
    id: string;
    name: string;
    type: 'LEZ' | 'district' | 'commercial';
    area: number;
    restrictions: number;
    status: 'active' | 'inactive';
}

export default function ZonesPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [zones] = useState<Zone[]>([
        {
            id: '1',
            name: 'LEZ Quận 1',
            type: 'LEZ',
            area: 15.5,
            restrictions: 5,
            status: 'active',
        },
        {
            id: '2',
            name: 'Khu thương mại Quận 7',
            type: 'commercial',
            area: 8.2,
            restrictions: 3,
            status: 'active',
        },
        {
            id: '3',
            name: 'Quận Gò Vấp',
            type: 'district',
            area: 19.7,
            restrictions: 2,
            status: 'active',
        },
    ]);

    const columns: Column<Zone>[] = [
        { key: 'name', header: 'Tên vùng' },
        {
            key: 'type',
            header: 'Loại',
            render: (z) => (
                <Badge variant="default">
                    {z.type === 'LEZ' ? 'Vùng phát thải thấp' :
                     z.type === 'commercial' ? 'Thương mại' : 'Hành chính'}
                </Badge>
            ),
        },
        {
            key: 'area',
            header: 'Diện tích',
            render: (z) => `${z.area} km²`,
        },
        { key: 'restrictions', header: 'Số hạn chế' },
        {
            key: 'status',
            header: 'Trạng thái',
            render: (z) => (
                <Badge variant={z.status === 'active' ? 'success' : 'error'}>
                    {z.status === 'active' ? 'Hoạt động' : 'Ngưng'}
                </Badge>
            ),
        },
    ];

    const filteredZones = zones.filter((z) =>
        z.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Vùng & Zone</h1>
                    <p className="text-gray-500 mt-1">Quản lý vùng địa lý và phân loại</p>
                </div>
                <Button>
                    <Plus size={16} className="mr-2" />
                    Thêm vùng
                </Button>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <Card>
                    <CardBody className="flex items-center gap-3">
                        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl">
                            <Map size={24} className="text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{zones.length}</p>
                            <p className="text-sm text-gray-500">Tổng vùng</p>
                        </div>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="flex items-center gap-3">
                        <div className="p-3 bg-red-100 dark:bg-red-900/50 rounded-xl">
                            <Map size={24} className="text-red-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{zones.filter(z => z.type === 'LEZ').length}</p>
                            <p className="text-sm text-gray-500">Vùng LEZ</p>
                        </div>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="flex items-center gap-3">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-xl">
                            <Map size={24} className="text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">
                                {zones.reduce((sum, z) => sum + z.area, 0).toFixed(1)} km²
                            </p>
                            <p className="text-sm text-gray-500">Tổng diện tích</p>
                        </div>
                    </CardBody>
                </Card>
            </div>

            <Card>
                <CardBody>
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <Input
                            placeholder="Tìm vùng..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardBody>
            </Card>

            <Card>
                <CardHeader>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Danh sách vùng</h2>
                </CardHeader>
                <CardBody>
                    <DataTable
                        columns={columns}
                        data={filteredZones}
                        loading={false}
                        emptyMessage="Chưa có vùng"
                    />
                </CardBody>
            </Card>
        </div>
    );
}
