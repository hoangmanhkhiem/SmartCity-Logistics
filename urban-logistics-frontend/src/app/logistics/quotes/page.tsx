'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardBody, CardHeader, Button, Input, DataTable } from '@/components/ui';
import { quotesApi } from '@/lib/api';
import { BarChart3, MapPin } from 'lucide-react';
import type { Column } from '@/components/ui';

const QuoteLocationMapPicker = dynamic(() => import('@/components/logistics/quote-location-map-picker'), {
    ssr: false,
    loading: () => (
        <div className="h-[380px] bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-gray-500">
            Đang tải Mapbox…
        </div>
    ),
});

type QuoteRow = {
    carrierId: string;
    carrierName: string;
    organization?: string;
    estimatedFeeVnd: number;
    estimatedEtaMinutes: number;
    modelNote?: string;
};

export default function LogisticsQuotesPage() {
    const [pickupLat, setPickupLat] = useState('21.0285');
    const [pickupLon, setPickupLon] = useState('105.854');
    const [deliveryLat, setDeliveryLat] = useState('21.006');
    const [deliveryLon, setDeliveryLon] = useState('105.78');
    const [weightKg, setWeightKg] = useState('2');
    const [rows, setRows] = useState<QuoteRow[]>([]);
    const [distanceKm, setDistanceKm] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [mapTarget, setMapTarget] = useState<'pickup' | 'delivery'>('pickup');

    const pickupPoint = {
        lat: Number(pickupLat) || 21.0285,
        lng: Number(pickupLon) || 105.854,
    };
    const deliveryPoint = {
        lat: Number(deliveryLat) || 21.006,
        lng: Number(deliveryLon) || 105.78,
    };

    const runCompare = async () => {
        setLoading(true);
        try {
            const res = await quotesApi.compare({
                pickupLat: Number(pickupLat),
                pickupLon: Number(pickupLon),
                deliveryLat: Number(deliveryLat),
                deliveryLon: Number(deliveryLon),
                weightKg: weightKg ? Number(weightKg) : undefined,
            });
            setRows(res.data.quotes || []);
            setDistanceKm(res.data.distanceKm ?? null);
        } catch (e) {
            console.error(e);
            setRows([]);
        } finally {
            setLoading(false);
        }
    };

    const columns: Column<QuoteRow>[] = [
        { key: 'carrierName', header: 'Hãng' },
        { key: 'organization', header: 'Tổ chức' },
        {
            key: 'estimatedFeeVnd',
            header: 'Ước phí (VNĐ)',
            render: (q) => q.estimatedFeeVnd.toLocaleString('vi-VN'),
        },
        { key: 'estimatedEtaMinutes', header: 'ETA (phút)' },
        { key: 'modelNote', header: 'Ghi chú', className: 'max-w-xs text-xs' },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <BarChart3 className="text-indigo-600" />
                    So sánh cước carrier
                </h1>
                <p className="text-gray-500 mt-1">
                    Ước lượng nội bộ (stub). Sau này nối API GHN / GHTK / Shopee Express thật. Chọn điểm lấy/giao trên bản đồ
                    Mapbox (cần <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">NEXT_PUBLIC_MAPBOX_TOKEN</code>).
                </p>
            </div>

            <Card>
                <CardHeader>
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <MapPin className="text-emerald-600" size={20} />
                        Chọn trên bản đồ
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Bấm &quot;Điểm lấy&quot; hoặc &quot;Điểm giao&quot;, sau đó click map hoặc kéo ghim L (lấy) / G (giao).
                    </p>
                </CardHeader>
                <CardBody className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                        <Button
                            type="button"
                            variant={mapTarget === 'pickup' ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => setMapTarget('pickup')}
                        >
                            Điểm lấy hàng
                        </Button>
                        <Button
                            type="button"
                            variant={mapTarget === 'delivery' ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => setMapTarget('delivery')}
                        >
                            Điểm giao
                        </Button>
                    </div>
                    <div className="h-[380px]">
                        <QuoteLocationMapPicker
                            pickup={pickupPoint}
                            delivery={deliveryPoint}
                            activeTarget={mapTarget}
                            onPickupChange={(lat, lng) => {
                                setPickupLat(lat.toFixed(6));
                                setPickupLon(lng.toFixed(6));
                            }}
                            onDeliveryChange={(lat, lng) => {
                                setDeliveryLat(lat.toFixed(6));
                                setDeliveryLon(lng.toFixed(6));
                            }}
                        />
                    </div>
                </CardBody>
            </Card>

            <Card>
                <CardHeader>
                    <h2 className="text-lg font-semibold">Tham số</h2>
                </CardHeader>
                <CardBody className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    <Input label="Pickup lat" value={pickupLat} onChange={(e) => setPickupLat(e.target.value)} />
                    <Input label="Pickup lon" value={pickupLon} onChange={(e) => setPickupLon(e.target.value)} />
                    <Input label="Delivery lat" value={deliveryLat} onChange={(e) => setDeliveryLat(e.target.value)} />
                    <Input label="Delivery lon" value={deliveryLon} onChange={(e) => setDeliveryLon(e.target.value)} />
                    <Input label="Khối lượng (kg)" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} />
                    <div className="flex items-end">
                        <Button className="w-full" onClick={runCompare} disabled={loading}>
                            {loading ? '...' : 'So sánh'}
                        </Button>
                    </div>
                </CardBody>
            </Card>

            {distanceKm != null && (
                <p className="text-sm text-gray-600 dark:text-gray-400">Khoảng cách ước lượng: {distanceKm} km</p>
            )}

            <Card>
                <CardHeader>
                    <h2 className="text-lg font-semibold">Kết quả (sắp xếp theo phí)</h2>
                </CardHeader>
                <CardBody>
                    <DataTable columns={columns} data={rows} loading={loading} emptyMessage="Chạy so sánh để xem bảng giá" />
                </CardBody>
            </Card>
        </div>
    );
}
