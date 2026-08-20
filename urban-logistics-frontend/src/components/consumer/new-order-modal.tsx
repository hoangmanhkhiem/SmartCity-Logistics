'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Modal, Button, Input, Badge } from '@/components/ui';
import { carrierApi, orderApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { MapPin, Package, CheckCircle2 } from 'lucide-react';

const Map = dynamic(() => import('@/components/shared/map'), { ssr: false });

interface CarrierQuote {
    carrierId: number;
    carrierName: string;
    organization?: string;
    estimatedFeeVnd: number;
    estimatedEtaMinutes: number;
    modelNote: string;
}

interface NewOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: () => void;
}

type Step = 'address' | 'compare' | 'done';

export default function NewOrderModal({ isOpen, onClose, onCreated }: NewOrderModalProps) {
    const user = useAuthStore((s) => s.user);
    const [step, setStep] = useState<Step>('address');
    const [pickupAddress, setPickupAddress] = useState('');
    const [pickupLat, setPickupLat] = useState('21.0285');
    const [pickupLon, setPickupLon] = useState('105.8542');
    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [deliveryLat, setDeliveryLat] = useState('21.0350');
    const [deliveryLon, setDeliveryLon] = useState('105.8100');
    const [weightKg, setWeightKg] = useState('1');
    const [comparing, setComparing] = useState(false);
    const [compareError, setCompareError] = useState('');
    const [quotes, setQuotes] = useState<CarrierQuote[]>([]);
    const [selectedCarrierId, setSelectedCarrierId] = useState<number | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const reset = () => {
        setStep('address');
        setPickupAddress('');
        setDeliveryAddress('');
        setWeightKg('1');
        setQuotes([]);
        setSelectedCarrierId(null);
        setCompareError('');
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    const handleCompare = async () => {
        setComparing(true);
        setCompareError('');
        try {
            const res = await carrierApi.compareForRoute({
                pickupLat: Number(pickupLat),
                pickupLon: Number(pickupLon),
                deliveryLat: Number(deliveryLat),
                deliveryLon: Number(deliveryLon),
                weightKg: Number(weightKg) || 1,
            });
            const list: CarrierQuote[] = res.data?.quotes ?? [];
            setQuotes(list);
            setSelectedCarrierId(list[0]?.carrierId ?? null);
            setStep('compare');
        } catch (e) {
            console.error(e);
            setCompareError('Không lấy được báo giá. Kiểm tra lại tọa độ điểm giao.');
        } finally {
            setComparing(false);
        }
    };

    const handleSubmit = async () => {
        if (!selectedCarrierId) return;
        setSubmitting(true);
        try {
            await orderApi.create({
                carrierId: selectedCarrierId,
                customerId: user?.id,
                pickupAddress: pickupAddress || undefined,
                pickupLat: Number(pickupLat),
                pickupLon: Number(pickupLon),
                deliveryAddress: deliveryAddress || undefined,
                deliveryLat: Number(deliveryLat),
                deliveryLon: Number(deliveryLon),
                weightKg: Number(weightKg) || undefined,
            });
            setStep('done');
        } catch (e) {
            console.error(e);
            alert('Không tạo được đơn hàng. Thử lại sau.');
        } finally {
            setSubmitting(false);
        }
    };

    const markers = [
        { id: 'pickup', coordinates: [Number(pickupLon), Number(pickupLat)] as [number, number], type: 'facility' as const, label: 'Lấy hàng' },
        { id: 'delivery', coordinates: [Number(deliveryLon), Number(deliveryLat)] as [number, number], type: 'destination' as const, label: 'Giao hàng' },
    ];

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Đặt đơn giao hàng mới" size="xl">
            {step === 'address' && (
                <div className="space-y-4">
                    <div className="h-64 w-full overflow-hidden rounded-lg">
                        <Map markers={markers} center={[Number(deliveryLon), Number(deliveryLat)]} zoom={12} showZonesAndRestrictions />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <p className="flex items-center gap-1 text-sm font-medium text-emerald-700">
                                <Package size={14} /> Điểm lấy hàng
                            </p>
                            <Input label="Địa chỉ" value={pickupAddress} onChange={(e) => setPickupAddress(e.target.value)} />
                            <div className="grid grid-cols-2 gap-2">
                                <Input label="Vĩ độ (lat)" value={pickupLat} onChange={(e) => setPickupLat(e.target.value)} />
                                <Input label="Kinh độ (lon)" value={pickupLon} onChange={(e) => setPickupLon(e.target.value)} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <p className="flex items-center gap-1 text-sm font-medium text-indigo-700">
                                <MapPin size={14} /> Điểm giao hàng
                            </p>
                            <Input label="Địa chỉ" value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} />
                            <div className="grid grid-cols-2 gap-2">
                                <Input label="Vĩ độ (lat)" value={deliveryLat} onChange={(e) => setDeliveryLat(e.target.value)} />
                                <Input label="Kinh độ (lon)" value={deliveryLon} onChange={(e) => setDeliveryLon(e.target.value)} />
                            </div>
                        </div>
                    </div>
                    <Input label="Khối lượng (kg)" type="number" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} />
                    {compareError && <p className="text-sm text-red-500">{compareError}</p>}
                    <div className="flex justify-end gap-2 border-t pt-4">
                        <Button variant="outline" onClick={handleClose}>Hủy</Button>
                        <Button onClick={handleCompare} disabled={comparing}>
                            {comparing ? 'Đang so sánh...' : 'So sánh giá các hãng'}
                        </Button>
                    </div>
                </div>
            )}

            {step === 'compare' && (
                <div className="space-y-4">
                    <p className="text-sm text-slate-500">Chọn hãng vận chuyển phù hợp — sắp xếp theo phí ước tính thấp nhất trước.</p>
                    {quotes.length === 0 ? (
                        <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                            Không có hãng nào phục vụ khu vực giao hàng này.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {quotes.map((q) => (
                                <label
                                    key={q.carrierId}
                                    className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors ${
                                        selectedCarrierId === q.carrierId
                                            ? 'border-indigo-400 bg-indigo-50 dark:border-indigo-600 dark:bg-indigo-900/20'
                                            : 'border-slate-200 dark:border-slate-700'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="radio"
                                            name="carrier"
                                            checked={selectedCarrierId === q.carrierId}
                                            onChange={() => setSelectedCarrierId(q.carrierId)}
                                        />
                                        <div>
                                            <p className="font-medium text-slate-900 dark:text-white">{q.carrierName}</p>
                                            <p className="text-xs text-slate-500">{q.organization} · ETA ~{q.estimatedEtaMinutes} phút</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-slate-900 dark:text-white">{formatCurrency(q.estimatedFeeVnd)}</p>
                                        {quotes[0]?.carrierId === q.carrierId && <Badge variant="success">Rẻ nhất</Badge>}
                                    </div>
                                </label>
                            ))}
                        </div>
                    )}
                    <div className="flex justify-end gap-2 border-t pt-4">
                        <Button variant="outline" onClick={() => setStep('address')}>Quay lại</Button>
                        <Button onClick={handleSubmit} disabled={!selectedCarrierId || submitting}>
                            {submitting ? 'Đang tạo đơn...' : 'Xác nhận đặt đơn'}
                        </Button>
                    </div>
                </div>
            )}

            {step === 'done' && (
                <div className="space-y-4 py-6 text-center">
                    <CheckCircle2 size={48} className="mx-auto text-green-500" />
                    <p className="text-lg font-medium text-slate-900 dark:text-white">Đặt đơn thành công!</p>
                    <p className="text-sm text-slate-500">Đơn hàng của bạn đã được ghi nhận và chờ hãng vận chuyển xử lý.</p>
                    <Button
                        onClick={() => {
                            reset();
                            onCreated();
                        }}
                    >
                        Đóng
                    </Button>
                </div>
            )}
        </Modal>
    );
}
