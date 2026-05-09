'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardBody, CardHeader, Button, Input, Modal, Badge, Select } from '@/components/ui';
import { dispatchApi, vehicleApi, driversApi } from '@/lib/api';
import { viStatus } from '@/lib/status-labels';
import { formatDateTime } from '@/lib/utils';
import { Package, Truck, Sparkles, Link2, ClipboardList, ExternalLink } from 'lucide-react';

type LegRow = {
    id: string;
    status: string;
    shipment?: {
        trackingNo?: string;
        weight?: number;
        order?: { orderNumber?: string; pickupAddress?: string; deliveryAddress?: string };
    };
};

type VehicleOpt = { id: string; plate: string; status: string; carrier?: { name: string } };
type DriverOpt = { id: string; name: string; phone?: string };

type RecentAssignmentRow = {
    id: string;
    status: string;
    assignedAt: string;
    vehicle?: { plate?: string; type?: string };
    driver?: { name?: string; phone?: string } | null;
    leg?: {
        shipment?: {
            trackingNo?: string;
            order?: { orderNumber?: string } | null;
        };
    };
};

export default function LogisticsDispatchPage() {
    const [legs, setLegs] = useState<LegRow[]>([]);
    const [vehicles, setVehicles] = useState<VehicleOpt[]>([]);
    const [drivers, setDrivers] = useState<DriverOpt[]>([]);
    const [loading, setLoading] = useState(true);
    const [assignOpen, setAssignOpen] = useState(false);
    const [selectedLeg, setSelectedLeg] = useState<LegRow | null>(null);
    const [vehicleId, setVehicleId] = useState('');
    const [driverId, setDriverId] = useState('');
    const [suggest, setSuggest] = useState<Record<string, unknown> | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
    const [batchVehicleId, setBatchVehicleId] = useState('');
    const [batchDriverId, setBatchDriverId] = useState('');
    const [enqueueOrderId, setEnqueueOrderId] = useState('');
    const [enqueueMsg, setEnqueueMsg] = useState<string | null>(null);
    const [recent, setRecent] = useState<RecentAssignmentRow[]>([]);
    const [recentLoading, setRecentLoading] = useState(false);

    const fetchRecent = useCallback(async () => {
        setRecentLoading(true);
        try {
            const res = await dispatchApi.getRecentAssignments({ limit: 35 });
            setRecent(Array.isArray(res.data) ? res.data : []);
        } catch (e) {
            console.error(e);
            setRecent([]);
        } finally {
            setRecentLoading(false);
        }
    }, []);

    const fetchLegs = useCallback(async () => {
        setLoading(true);
        try {
            const res = await dispatchApi.getUnassignedLegs();
            setLegs(res.data);
        } catch (e) {
            console.error(e);
            setLegs([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const loadVehiclesDrivers = useCallback(async () => {
        try {
            const [vRes, dRes] = await Promise.all([
                vehicleApi.getAll({ limit: 100 }),
                driversApi.list(),
            ]);
            const vData = vRes.data.data || vRes.data;
            setVehicles(Array.isArray(vData) ? vData : []);
            const dData = dRes.data;
            setDrivers(Array.isArray(dData) ? dData : []);
        } catch (e) {
            console.error(e);
        }
    }, []);

    useEffect(() => {
        fetchLegs();
        loadVehiclesDrivers();
        fetchRecent();
    }, [fetchLegs, loadVehiclesDrivers, fetchRecent]);

    const refreshAll = useCallback(() => {
        void fetchLegs();
        void fetchRecent();
    }, [fetchLegs, fetchRecent]);

    const vehicleOptions = useMemo(
        () =>
            vehicles.map((v) => ({
                value: v.id,
                label: `${v.plate} — ${viStatus(v.status)}${v.carrier?.name ? ` (${v.carrier.name})` : ''}`,
            })),
        [vehicles],
    );

    const driverOptions = useMemo(
        () => drivers.map((d) => ({ value: d.id, label: `${d.name}${d.phone ? ` · ${d.phone}` : ''}` })),
        [drivers],
    );

    const toggleLeg = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const selectAll = () => {
        if (selectedIds.size === legs.length) setSelectedIds(new Set());
        else setSelectedIds(new Set(legs.map((l) => l.id)));
    };

    const openAssign = (leg: LegRow) => {
        setSelectedLeg(leg);
        setVehicleId(batchVehicleId || '');
        setDriverId(batchDriverId || '');
        setSuggest(null);
        setAssignOpen(true);
    };

    const runSuggest = async (legId: string) => {
        try {
            const res = await dispatchApi.suggestVehicle(legId);
            setSuggest(res.data);
            const vid = (res.data as { suggestion?: { vehicleId?: string } })?.suggestion?.vehicleId;
            if (vid) {
                setVehicleId(vid);
                setBatchVehicleId(vid);
            }
        } catch (e) {
            console.error(e);
            setSuggest({ error: 'Không gợi ý được — thử chọn xe thủ công' });
        }
    };

    const submitAssign = async () => {
        if (!selectedLeg || !vehicleId) return;
        try {
            await dispatchApi.assign({
                legId: selectedLeg.id,
                vehicleId,
                driverId: driverId || undefined,
            });
            setAssignOpen(false);
            setSelectedIds((prev) => {
                const n = new Set(prev);
                n.delete(selectedLeg.id);
                return n;
            });
            fetchLegs();
            fetchRecent();
        } catch (e) {
            console.error(e);
        }
    };

    const submitBatch = async () => {
        const ids = [...selectedIds];
        if (!ids.length || !batchVehicleId) return;
        try {
            await dispatchApi.batchAssign({
                legIds: ids,
                vehicleId: batchVehicleId,
                driverId: batchDriverId || undefined,
            });
            setSelectedIds(new Set());
            fetchLegs();
            fetchRecent();
        } catch (e) {
            console.error(e);
        }
    };

    const runEnqueue = async () => {
        const id = enqueueOrderId.trim();
        if (!id) return;
        setEnqueueMsg(null);
        try {
            const res = await dispatchApi.enqueueOrder(id);
            setEnqueueMsg(
                res.data?.created
                    ? `Đã tạo leg mới — tracking ${res.data.trackingNo ?? ''}`
                    : 'Đơn đã có shipment/leg rồi',
            );
            setEnqueueOrderId('');
            fetchLegs();
        } catch (e: unknown) {
            const m = (e as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
            setEnqueueMsg(Array.isArray(m) ? m.join(', ') : m || 'Lỗi enqueue');
        }
    };

    const firstSelectedLeg = legs.find((l) => selectedIds.has(l.id));

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Điều phối — Leg chưa gán</h1>
                    <p className="text-gray-500 mt-1">
                        Gom nhiều đơn lên một xe, gán tài xế. Sau khi gán, xem bảng &quot;Phân công gần đây&quot; bên dưới; tra TRK
                        tại{' '}
                        <Link href="/delivery/tracking" className="text-blue-600 hover:underline">
                            Giao hàng → Tracking
                        </Link>
                        , xem tài xế tại{' '}
                        <Link href="/delivery/drivers" className="text-blue-600 hover:underline">
                            Tài xế
                        </Link>
                        .
                    </p>
                </div>
                <Button variant="outline" onClick={refreshAll} disabled={loading || recentLoading}>
                    Làm mới
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Link2 size={20} />
                        Đẩy đơn cũ vào hàng đợi
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">UUID đơn hàng — tạo shipment + leg nếu chưa có (backfill).</p>
                </CardHeader>
                <CardBody className="flex flex-wrap gap-2 items-end">
                    <div className="flex-1 min-w-[240px]">
                        <Input
                            label="Order ID"
                            value={enqueueOrderId}
                            onChange={(e) => setEnqueueOrderId(e.target.value)}
                            placeholder="Dán UUID từ trang Đơn hàng / API"
                        />
                    </div>
                    <Button type="button" onClick={runEnqueue} disabled={!enqueueOrderId.trim()}>
                        Enqueue
                    </Button>
                    {enqueueMsg && <p className="text-sm text-gray-600 dark:text-gray-400 w-full">{enqueueMsg}</p>}
                </CardBody>
            </Card>

            <Card>
                <CardHeader className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Package size={20} />
                        Hàng đợi điều phối ({legs.length})
                    </h2>
                    {legs.length > 0 && (
                        <Button variant="ghost" size="sm" type="button" onClick={selectAll}>
                            {selectedIds.size === legs.length ? 'Bỏ chọn hết' : 'Chọn tất cả'}
                        </Button>
                    )}
                </CardHeader>
                <CardBody className="space-y-4">
                    {legs.length > 0 && (
                        <div className="flex flex-wrap gap-3 items-end p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Gom đơn: đã chọn {selectedIds.size} leg
                            </span>
                            <div className="w-56">
                                <Select
                                    label="Xe"
                                    placeholder="Chọn xe"
                                    options={vehicleOptions}
                                    value={batchVehicleId}
                                    onChange={setBatchVehicleId}
                                />
                            </div>
                            <div className="w-56">
                                <Select
                                    label="Tài xế (tuỳ chọn)"
                                    placeholder="Không bắt buộc"
                                    options={driverOptions}
                                    value={batchDriverId}
                                    onChange={setBatchDriverId}
                                />
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={!firstSelectedLeg}
                                onClick={() => firstSelectedLeg && runSuggest(firstSelectedLeg.id)}
                            >
                                <Sparkles size={16} className="mr-1" />
                                Gợi ý xe (leg đầu đã chọn)
                            </Button>
                            <Button type="button" disabled={!selectedIds.size || !batchVehicleId} onClick={submitBatch}>
                                <Truck size={16} className="mr-1" />
                                Gán {selectedIds.size || '…'} leg lên xe
                            </Button>
                        </div>
                    )}

                    {loading ? (
                        <p className="text-gray-500">Đang tải...</p>
                    ) : legs.length === 0 ? (
                        <div className="text-gray-500 space-y-2">
                            <p>Không có leg chưa gán.</p>
                            <ul className="list-disc list-inside text-sm space-y-1">
                                <li>Chạy lại seed: <code className="bg-gray-100 dark:bg-gray-900 px-1 rounded">npm run db:seed</code> (14 leg chờ trong demo).</li>
                                <li>Hoặc tạo đơn mới từ Giao hàng → Đơn hàng (tự sinh leg).</li>
                                <li>Hoặc dùng ô Enqueue ở trên với UUID đơn thiếu shipment.</li>
                            </ul>
                        </div>
                    ) : (
                        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                            {legs.map((leg) => (
                                <li key={leg.id} className="py-3 flex flex-wrap items-start gap-3">
                                    <label className="flex items-start gap-3 cursor-pointer flex-1 min-w-[200px]">
                                        <input
                                            type="checkbox"
                                            className="mt-1 rounded border-gray-300"
                                            checked={selectedIds.has(leg.id)}
                                            onChange={() => toggleLeg(leg.id)}
                                        />
                                        <div>
                                            <Badge variant="warning">{viStatus(leg.status)}</Badge>
                                            <span className="ml-2 font-mono text-sm">{leg.id.slice(0, 8)}…</span>
                                            {leg.shipment?.trackingNo && (
                                                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                                                    {leg.shipment.trackingNo}
                                                </span>
                                            )}
                                            {leg.shipment?.weight != null && (
                                                <span className="ml-2 text-xs text-gray-500">{leg.shipment.weight} kg</span>
                                            )}
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 max-w-3xl">
                                                {leg.shipment?.order?.orderNumber} — {leg.shipment?.order?.pickupAddress} →{' '}
                                                {leg.shipment?.order?.deliveryAddress}
                                            </p>
                                        </div>
                                    </label>
                                    <Button size="sm" variant="outline" onClick={() => openAssign(leg)}>
                                        Gán một leg
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    )}
                </CardBody>
            </Card>

            <Card>
                <CardHeader>
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <ClipboardList size={20} />
                        Phân công gần đây (kết quả điều phối)
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Các lần gán xe / tài xế mới nhất. Để theo dõi hành trình công khai, dùng mã TRK trên trang Tracking.
                    </p>
                    <div className="flex flex-wrap gap-3 mt-2 text-sm">
                        <Link
                            href="/delivery/tracking"
                            className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                        >
                            Mở Tracking <ExternalLink size={14} />
                        </Link>
                        <Link href="/delivery/drivers" className="inline-flex items-center gap-1 text-blue-600 hover:underline">
                            Danh sách tài xế <ExternalLink size={14} />
                        </Link>
                    </div>
                </CardHeader>
                <CardBody>
                    {recentLoading ? (
                        <p className="text-gray-500">Đang tải phân công...</p>
                    ) : recent.length === 0 ? (
                        <p className="text-gray-500">Chưa có phân công nào trong hệ thống (hoặc chưa gán leg).</p>
                    ) : (
                        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300">
                                    <tr>
                                        <th className="px-3 py-2 font-medium">Gán lúc</th>
                                        <th className="px-3 py-2 font-medium">TRK / Đơn</th>
                                        <th className="px-3 py-2 font-medium">Xe</th>
                                        <th className="px-3 py-2 font-medium">Tài xế</th>
                                        <th className="px-3 py-2 font-medium">Trạng thái PC</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {recent.map((a) => {
                                        const trk = a.leg?.shipment?.trackingNo;
                                        const ord = a.leg?.shipment?.order?.orderNumber;
                                        return (
                                            <tr key={a.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40">
                                                <td className="px-3 py-2 whitespace-nowrap">
                                                    {formatDateTime(a.assignedAt)}
                                                </td>
                                                <td className="px-3 py-2">
                                                    {trk && (
                                                        <span className="font-mono text-xs block text-gray-800 dark:text-gray-200">
                                                            {trk}
                                                        </span>
                                                    )}
                                                    {ord && <span className="text-xs text-gray-500">{ord}</span>}
                                                </td>
                                                <td className="px-3 py-2">
                                                    <span className="font-mono">{a.vehicle?.plate ?? '—'}</span>
                                                    {a.vehicle?.type && (
                                                        <span className="text-xs text-gray-500 block">{a.vehicle.type}</span>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2">
                                                    {a.driver?.name ?? '—'}
                                                    {a.driver?.phone && (
                                                        <span className="text-xs text-gray-500 block">{a.driver.phone}</span>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2">
                                                    <Badge variant="info">{viStatus(a.status)}</Badge>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardBody>
            </Card>

            <Modal isOpen={assignOpen} onClose={() => setAssignOpen(false)} title="Gán leg cho xe" size="lg">
                {selectedLeg && (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Leg <span className="font-mono">{selectedLeg.id}</span>
                        </p>
                        <Button type="button" variant="outline" size="sm" onClick={() => runSuggest(selectedLeg.id)}>
                            <Sparkles size={16} className="mr-1" />
                            Gợi ý xe gần điểm lấy
                        </Button>
                        {suggest && (
                            <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded-lg overflow-auto max-h-40">
                                {JSON.stringify(suggest, null, 2)}
                            </pre>
                        )}
                        <Select
                            label="Xe"
                            placeholder="Chọn xe"
                            options={vehicleOptions}
                            value={vehicleId}
                            onChange={setVehicleId}
                        />
                        <Select
                            label="Tài xế (tuỳ chọn)"
                            placeholder="Không bắt buộc"
                            options={driverOptions}
                            value={driverId}
                            onChange={setDriverId}
                        />
                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="outline" onClick={() => setAssignOpen(false)}>
                                Hủy
                            </Button>
                            <Button onClick={submitAssign} disabled={!vehicleId}>
                                Xác nhận gán
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
