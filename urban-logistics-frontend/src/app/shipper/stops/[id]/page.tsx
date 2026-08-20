'use client';

import { use, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Card, CardBody, Badge, Button, Steps } from '@/components/ui';
import { shipperApi, orderApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { viStatus } from '@/lib/status-labels';
import type { Stop, Order } from '@/types';
import type { GeoJsonFeatureCollection } from '@/components/shared/map';
import { ArrowLeft, Phone, MapPin, Camera, CheckCircle2, XCircle, Navigation, AlertTriangle } from 'lucide-react';

const Map = dynamic(() => import('@/components/shared/map'), { ssr: false });

const stopSteps = [
    { key: 'pending', label: 'Chưa đến' },
    { key: 'arrived', label: 'Đã đến' },
    { key: 'completed', label: 'Hoàn thành' },
];

const failReasons = [
    { value: 'customer_absent', label: 'Khách không có mặt' },
    { value: 'address_wrong', label: 'Sai địa chỉ' },
    { value: 'refused', label: 'Khách từ chối nhận' },
    { value: 'damaged', label: 'Hàng hư hỏng' },
    { value: 'other', label: 'Khác' },
];

export default function ShipperStopDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const stopId = Number(id);
    const router = useRouter();

    const [stop, setStop] = useState<Stop | null>(null);
    const [order, setOrder] = useState<Order | null>(null);
    const [routeId, setRouteId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [directionsLoading, setDirectionsLoading] = useState(false);
    const [directionsGeometry, setDirectionsGeometry] = useState<GeoJSON.LineString | null>(null);
    const [directionsRestrictions, setDirectionsRestrictions] = useState<GeoJsonFeatureCollection | undefined>(undefined);
    const [directionsError, setDirectionsError] = useState('');
    const [podPhotoUrl, setPodPhotoUrl] = useState('');
    const [podNote, setPodNote] = useState('');
    const [codAmountCollected, setCodAmountCollected] = useState('');
    const [showFailForm, setShowFailForm] = useState(false);
    const [failReason, setFailReason] = useState('');
    const [failNote, setFailNote] = useState('');

    // Không có route lấy 1 stop riêng lẻ — tìm qua route hôm nay của shipper rồi lọc theo id
    useEffect(() => {
        shipperApi.getTodayRoute().then(async (res) => {
            const route = res.data;
            const found = route?.stops?.find((s: Stop) => s.id === stopId) ?? null;
            setStop(found);
            setRouteId(route?.id ?? null);
            if (found?.codAmountDue) setCodAmountCollected(String(found.codAmountDue));
            if (found?.orderId) {
                try {
                    const oRes = await orderApi.getById(found.orderId);
                    setOrder(oRes.data);
                } catch { /* ignore */ }
            }
        }).catch((e) => console.error(e)).finally(() => setLoading(false));
    }, [stopId]);

    const stepIndex = stop ? stopSteps.findIndex((s) => s.key === stop.status) : 0;

    const handleArrive = async () => {
        setBusy(true);
        try {
            const res = await shipperApi.arriveStop(stopId);
            setStop(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setBusy(false);
        }
    };

    const handleComplete = async () => {
        setBusy(true);
        try {
            await shipperApi.completeStop(stopId, {
                podPhotoUrl: podPhotoUrl || undefined,
                podNote: podNote || undefined,
                codAmountCollected: codAmountCollected ? Number(codAmountCollected) : undefined,
            });
            router.push('/shipper/today');
        } catch (e) {
            console.error(e);
        } finally {
            setBusy(false);
        }
    };

    const handleFail = async () => {
        if (!failReason) return;
        setBusy(true);
        try {
            await shipperApi.failStop(stopId, { failedReason: failReason, note: failNote || undefined });
            router.push('/shipper/today');
        } catch (e) {
            console.error(e);
        } finally {
            setBusy(false);
        }
    };

    const handleGetDirections = async () => {
        if (!routeId) return;
        setDirectionsLoading(true);
        setDirectionsError('');
        try {
            const res = await shipperApi.getDirectionsToNextStop(routeId);
            setDirectionsGeometry(res.data?.route?.geometry ?? null);
            setDirectionsRestrictions(res.data?.restrictionsGeoJson ?? undefined);
        } catch (e) {
            console.error(e);
            setDirectionsError('Không lấy được chỉ đường. Thử lại sau.');
        } finally {
            setDirectionsLoading(false);
        }
    };

    const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        // Không có backend upload file riêng trong scope này — dùng data URL cục bộ làm placeholder minh chứng đã chụp.
        const reader = new FileReader();
        reader.onload = () => setPodPhotoUrl(String(reader.result));
        reader.readAsDataURL(file);
    };

    if (loading) {
        return <div className="py-24 text-center text-slate-500">Đang tải...</div>;
    }

    if (!stop) {
        return (
            <div className="py-24 text-center text-slate-500">
                Không tìm thấy điểm dừng này trong route hôm nay.
                <div className="mt-3"><Button variant="outline" onClick={() => router.push('/shipper/today')}>Quay lại</Button></div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <button onClick={() => router.push('/shipper/today')} className="flex items-center gap-1 text-sm text-slate-500">
                <ArrowLeft size={16} /> Quay lại route
            </button>

            <Card>
                <CardBody className="space-y-4">
                    <Steps steps={stopSteps} currentIndex={Math.max(stepIndex, 0)} />

                    <div className="flex items-start gap-2">
                        <MapPin size={18} className={stop.type === 'pickup' ? 'text-emerald-600' : 'text-indigo-600'} />
                        <div>
                            <p className="text-xs text-slate-500">{stop.type === 'pickup' ? 'Điểm lấy hàng' : 'Điểm giao hàng'}</p>
                            <p className="font-medium text-slate-900 dark:text-white">{stop.address}</p>
                        </div>
                    </div>

                    {order?.orderNumber && (
                        <p className="text-sm text-slate-500">Đơn: <span className="font-mono">{order.orderNumber}</span></p>
                    )}

                    {stop.contactPhone && (
                        <a href={`tel:${stop.contactPhone}`} className="flex items-center gap-2 rounded-lg bg-slate-50 dark:bg-slate-800 p-3 text-indigo-600">
                            <Phone size={18} /> Gọi {stop.contactPhone}
                        </a>
                    )}

                    {(stop.codAmountDue ?? 0) > 0 && (
                        <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 p-3">
                            <p className="text-sm text-amber-800 dark:text-amber-300">
                                Cần thu COD: <strong>{formatCurrency(stop.codAmountDue!)}</strong>
                            </p>
                        </div>
                    )}
                </CardBody>
            </Card>

            {routeId && ['pending', 'arrived'].includes(stop.status) && (
                <Card>
                    <CardBody className="space-y-3">
                        <Button variant="outline" className="w-full" onClick={handleGetDirections} disabled={directionsLoading}>
                            <Navigation size={16} className="mr-1 inline" />
                            {directionsLoading ? 'Đang tính chỉ đường...' : 'Chỉ đường (né đoạn cấm)'}
                        </Button>
                        {directionsError && <p className="text-sm text-red-500">{directionsError}</p>}
                        {directionsGeometry && (
                            <>
                                <div className="h-56 w-full overflow-hidden rounded-lg">
                                    <Map
                                        staticRouteGeometry={directionsGeometry}
                                        restrictionsGeoJson={directionsRestrictions}
                                        showZonesAndRestrictions
                                        stops={[{ id: stop.id, coordinates: [stop.longitude, stop.latitude], sequence: stop.sequence, type: stop.type, status: stop.status }]}
                                        zoom={14}
                                    />
                                </div>
                                {(directionsRestrictions?.features.length ?? 0) > 0 && (
                                    <div className="flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 p-2.5 text-sm text-orange-800 dark:border-orange-900 dark:bg-orange-900/20 dark:text-orange-300">
                                        <AlertTriangle size={16} className="shrink-0" />
                                        Tuyến này đi gần {directionsRestrictions!.features.length} đoạn cấm/hạn chế — đã ưu tiên né khi có thể.
                                    </div>
                                )}
                            </>
                        )}
                    </CardBody>
                </Card>
            )}

            {stop.status === 'pending' && (
                <Button className="w-full" size="lg" onClick={handleArrive} disabled={busy}>
                    Xác nhận đã đến điểm
                </Button>
            )}

            {stop.status === 'arrived' && !showFailForm && (
                <Card>
                    <CardBody className="space-y-4">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Hoàn thành điểm dừng</p>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Ảnh POD (chụp giao hàng)</label>
                            <label className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 p-4 cursor-pointer hover:border-indigo-400">
                                <Camera size={20} className="text-slate-400" />
                                <span className="text-sm text-slate-500">{podPhotoUrl ? 'Đã chọn ảnh' : 'Chụp / chọn ảnh'}</span>
                                <input type="file" accept="image/*" capture="environment" onChange={handlePhotoSelect} className="hidden" />
                            </label>
                            {podPhotoUrl && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={podPhotoUrl} alt="POD preview" className="mt-2 h-32 w-full object-cover rounded-lg" />
                            )}
                        </div>

                        {(stop.codAmountDue ?? 0) > 0 && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Số tiền đã thu (VNĐ)</label>
                                <input
                                    type="number"
                                    value={codAmountCollected}
                                    onChange={(e) => setCodAmountCollected(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Ghi chú</label>
                            <textarea
                                value={podNote}
                                onChange={(e) => setPodNote(e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <Button variant="outline" onClick={() => setShowFailForm(true)} disabled={busy}>
                                <XCircle size={16} className="mr-1 inline text-red-500" /> Báo thất bại
                            </Button>
                            <Button onClick={handleComplete} disabled={busy}>
                                <CheckCircle2 size={16} className="mr-1 inline" /> Hoàn thành
                            </Button>
                        </div>
                    </CardBody>
                </Card>
            )}

            {stop.status === 'arrived' && showFailForm && (
                <Card>
                    <CardBody className="space-y-4">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Báo giao hàng thất bại</p>
                        <div className="space-y-2">
                            {failReasons.map((r) => (
                                <label key={r.value} className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-600 p-2.5 cursor-pointer">
                                    <input type="radio" name="failReason" checked={failReason === r.value} onChange={() => setFailReason(r.value)} />
                                    <span className="text-sm">{r.label}</span>
                                </label>
                            ))}
                        </div>
                        <textarea
                            value={failNote}
                            onChange={(e) => setFailNote(e.target.value)}
                            placeholder="Ghi chú thêm (tuỳ chọn)"
                            rows={2}
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                        />
                        <div className="grid grid-cols-2 gap-2">
                            <Button variant="outline" onClick={() => setShowFailForm(false)}>Quay lại</Button>
                            <Button onClick={handleFail} disabled={busy || !failReason}>Xác nhận thất bại</Button>
                        </div>
                    </CardBody>
                </Card>
            )}

            {['completed', 'failed', 'skipped'].includes(stop.status) && (
                <Card>
                    <CardBody className="text-center py-6 space-y-2">
                        <Badge variant={stop.status === 'completed' ? 'success' : 'error'}>{viStatus(stop.status)}</Badge>
                        <p className="text-sm text-slate-500">Điểm dừng này đã được xử lý xong.</p>
                    </CardBody>
                </Card>
            )}
        </div>
    );
}
