'use client';

import { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader, DataTable, Badge, Select, Button, Steps } from '@/components/ui';
import type { Column } from '@/components/ui';
import { routeApi, zoneApi, vehicleApi, shipperApi } from '@/lib/api';
import { useCurrentCarrier } from '@/lib/use-current-carrier';
import { viStatus } from '@/lib/status-labels';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Route, Order, Zone, Vehicle, ShipperProfile } from '@/types';
import { Route as RouteIcon, Plus, MapPin, Package, AlertTriangle, X } from 'lucide-react';

const statusVariant: Record<string, 'warning' | 'success' | 'info' | 'default'> = {
    planned: 'warning',
    in_progress: 'info',
    completed: 'success',
    cancelled: 'default',
};

const wizardSteps = [
    { key: 'zone', label: 'Chọn khu vực' },
    { key: 'orders', label: 'Chọn đơn' },
    { key: 'assign', label: 'Xe & Shipper' },
    { key: 'confirm', label: 'Xác nhận' },
];

export default function DeliveryRoutesPage() {
    const { carrier } = useCurrentCarrier();
    const [routes, setRoutes] = useState<Route[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');

    const [wizardOpen, setWizardOpen] = useState(false);
    const [step, setStep] = useState(0);
    const [zones, setZones] = useState<Zone[]>([]);
    const [zoneId, setZoneId] = useState<number | null>(null);
    const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
    const [selectedOrderIds, setSelectedOrderIds] = useState<Set<number>>(new Set());
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [shippers, setShippers] = useState<ShipperProfile[]>([]);
    const [vehicleId, setVehicleId] = useState('');
    const [shipperId, setShipperId] = useState('');
    const [violations, setViolations] = useState<Array<{ restrictionId: number; severity: string; description: string | null }> | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchRoutes = async () => {
        if (!carrier) return;
        setLoading(true);
        try {
            const params: Record<string, unknown> = { carrierId: carrier.id, limit: 20 };
            if (statusFilter) params.status = statusFilter;
            const res = await routeApi.getAll(params);
            setRoutes(res.data.data ?? res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoutes();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [carrier, statusFilter]);

    useEffect(() => {
        zoneApi.getAll({ limit: 100 }).then((res) => setZones(res.data.data ?? res.data)).catch(() => setZones([]));
    }, []);

    const openWizard = () => {
        setStep(0);
        setZoneId(null);
        setPendingOrders([]);
        setSelectedOrderIds(new Set());
        setVehicleId('');
        setShipperId('');
        setViolations(null);
        setError(null);
        setWizardOpen(true);
    };

    const goToOrders = async (zId: number) => {
        if (!carrier) return;
        setZoneId(zId);
        try {
            const res = await routeApi.getUnassignedOrders(carrier.id, zId);
            setPendingOrders(res.data);
        } catch (e) {
            console.error(e);
            setPendingOrders([]);
        }
        setStep(1);
    };

    const goToAssign = async () => {
        if (!carrier || !zoneId) return;
        try {
            const [vRes, sRes, suggestRes] = await Promise.all([
                vehicleApi.getAll({ limit: 100 }),
                shipperApi.listByCarrier(carrier.id),
                routeApi.suggestVehicleShipper(carrier.id, zoneId),
            ]);
            const carrierVehicles = (vRes.data.data ?? vRes.data).filter((v: Vehicle) => v.carrierId === carrier.id && v.status === 'available');
            setVehicles(carrierVehicles);
            setShippers((sRes.data as ShipperProfile[]).filter((s) => s.status === 'on_shift'));
            const suggestion = suggestRes.data?.suggestion;
            if (suggestion) {
                setVehicleId(String(suggestion.vehicleId));
                setShipperId(String(suggestion.shipperId));
            }
        } catch (e) {
            console.error(e);
        }
        setStep(2);
    };

    const submitRoute = async (force = false) => {
        if (!carrier || !zoneId || !vehicleId || !shipperId) return;
        setSubmitting(true);
        setError(null);
        try {
            await routeApi.createFromOrders({
                carrierId: carrier.id,
                vehicleId: Number(vehicleId),
                shipperId: Number(shipperId),
                zoneId,
                orderIds: [...selectedOrderIds],
                shiftDate: new Date().toISOString().slice(0, 10),
                force,
            });
            setWizardOpen(false);
            fetchRoutes();
        } catch (e: unknown) {
            const resp = (e as { response?: { data?: { message?: unknown; violations?: unknown } } })?.response?.data;
            const violationList = (resp as { violations?: typeof violations })?.violations;
            if (violationList?.length) {
                setViolations(violationList);
            } else {
                const msg = resp?.message;
                setError(Array.isArray(msg) ? msg.join(', ') : String(msg ?? 'Không thể tạo route'));
            }
        } finally {
            setSubmitting(false);
        }
    };

    const toggleOrder = (id: number) => {
        setSelectedOrderIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const columns: Column<Route>[] = [
        { key: 'code', header: 'Mã chuyến' },
        { key: 'shiftDate', header: 'Ngày', render: (r) => formatDate(r.shiftDate) },
        { key: 'vehicle', header: 'Xe', render: (r) => r.vehicle?.plate ?? '—' },
        { key: 'shipper', header: 'Shipper', render: (r) => r.shipper?.name ?? '—' },
        { key: 'zone', header: 'Khu vực', render: (r) => r.zone?.name ?? '—' },
        {
            key: 'stops',
            header: 'Điểm dừng',
            render: (r) => <Badge variant="info">{r.stops?.length ?? 0}</Badge>,
        },
        {
            key: 'status',
            header: 'Trạng thái',
            render: (r) => <Badge variant={statusVariant[r.status] || 'default'}>{viStatus(r.status)}</Badge>,
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Chuyến giao (Route)</h1>
                    <p className="text-slate-500 mt-1">Gom đơn theo khu vực thành chuyến giao cho 1 xe + 1 shipper</p>
                </div>
                <Button onClick={openWizard} disabled={!carrier}>
                    <Plus size={18} className="mr-1" />
                    Tạo chuyến mới
                </Button>
            </div>

            <Card>
                <CardBody className="flex flex-wrap gap-4 items-end">
                    <div className="w-48">
                        <Select
                            label="Trạng thái"
                            options={[
                                { value: '', label: 'Tất cả' },
                                { value: 'planned', label: 'Đã lên kế hoạch' },
                                { value: 'in_progress', label: 'Đang giao' },
                                { value: 'completed', label: 'Hoàn thành' },
                                { value: 'cancelled', label: 'Đã hủy' },
                            ]}
                            value={statusFilter}
                            onChange={setStatusFilter}
                        />
                    </div>
                </CardBody>
            </Card>

            <Card>
                <CardHeader>
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Danh sách chuyến giao</h2>
                </CardHeader>
                <CardBody>
                    <DataTable columns={columns} data={routes} loading={loading} emptyMessage="Chưa có chuyến giao nào" />
                </CardBody>
            </Card>

            {wizardOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setWizardOpen(false)} />
                    <div className="relative w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col rounded-2xl bg-white shadow-2xl dark:bg-slate-800">
                        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700">
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Tạo chuyến giao mới</h2>
                            <button onClick={() => setWizardOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="px-6 pt-4">
                            <Steps steps={wizardSteps} currentIndex={step} />
                        </div>
                        <div className="flex-1 overflow-y-auto px-6 py-4">
                            {step === 0 && (
                                <div className="space-y-3">
                                    <p className="text-sm text-slate-600 dark:text-slate-400">Chọn khu vực cần gom đơn giao hàng:</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {zones.map((z) => (
                                            <button
                                                key={z.id}
                                                onClick={() => goToOrders(z.id)}
                                                className="flex items-center gap-2 rounded-lg border border-slate-200 p-3 text-left hover:border-indigo-500 hover:bg-indigo-50 dark:border-slate-600 dark:hover:bg-indigo-900/20"
                                            >
                                                <MapPin size={18} className="text-indigo-600 shrink-0" />
                                                <span className="text-sm font-medium">{z.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {step === 1 && (
                                <div className="space-y-3">
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        Đơn hàng chưa gom trong khu vực đã chọn ({pendingOrders.length}):
                                    </p>
                                    {pendingOrders.length === 0 ? (
                                        <p className="text-sm text-slate-500">Không có đơn nào đang chờ trong khu vực này.</p>
                                    ) : (
                                        <div className="space-y-2 max-h-80 overflow-y-auto">
                                            {pendingOrders.map((o) => (
                                                <label
                                                    key={o.id}
                                                    className="flex items-start gap-3 rounded-lg border border-slate-200 p-3 cursor-pointer hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-700/50"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedOrderIds.has(o.id)}
                                                        onChange={() => toggleOrder(o.id)}
                                                        className="mt-1"
                                                    />
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <Package size={14} className="text-slate-400" />
                                                            <span className="font-mono text-sm font-medium">{o.orderNumber}</span>
                                                            {(o.codAmount ?? 0) > 0 && (
                                                                <Badge variant="warning" className="text-xs">COD {formatCurrency(o.codAmount!)}</Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-slate-500 mt-0.5">{o.pickupAddress} → {o.deliveryAddress}</p>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                    <div className="flex justify-between pt-2">
                                        <Button variant="outline" onClick={() => setStep(0)}>Quay lại</Button>
                                        <Button onClick={goToAssign} disabled={!selectedOrderIds.size}>
                                            Tiếp tục ({selectedOrderIds.size} đơn)
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-4">
                                    <Select
                                        label="Xe"
                                        placeholder="Chọn xe"
                                        options={vehicles.map((v) => ({ value: String(v.id), label: `${v.plate} — ${v.type}` }))}
                                        value={vehicleId}
                                        onChange={setVehicleId}
                                    />
                                    <Select
                                        label="Shipper (đang trong ca)"
                                        placeholder="Chọn shipper"
                                        options={shippers.map((s) => ({ value: String(s.userId), label: s.user?.name ?? `Shipper #${s.userId}` }))}
                                        value={shipperId}
                                        onChange={setShipperId}
                                    />
                                    <div className="flex justify-between pt-2">
                                        <Button variant="outline" onClick={() => setStep(1)}>Quay lại</Button>
                                        <Button onClick={() => { setStep(3); }} disabled={!vehicleId || !shipperId}>
                                            Tiếp tục
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="space-y-4">
                                    <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-900/40 space-y-1 text-sm">
                                        <p><strong>Khu vực:</strong> {zones.find((z) => z.id === zoneId)?.name}</p>
                                        <p><strong>Số đơn:</strong> {selectedOrderIds.size}</p>
                                        <p><strong>Xe:</strong> {vehicles.find((v) => String(v.id) === vehicleId)?.plate}</p>
                                        <p><strong>Shipper:</strong> {shippers.find((s) => String(s.userId) === shipperId)?.user?.name}</p>
                                    </div>

                                    {violations && violations.length > 0 && (
                                        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-900/20">
                                            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-medium mb-2">
                                                <AlertTriangle size={18} />
                                                Cảnh báo vi phạm quy định giao thông
                                            </div>
                                            <ul className="text-sm text-amber-700 dark:text-amber-400 space-y-1 list-disc list-inside">
                                                {violations.map((v) => (
                                                    <li key={v.restrictionId}>{v.description ?? `Restriction #${v.restrictionId}`} ({v.severity})</li>
                                                ))}
                                            </ul>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="mt-3"
                                                onClick={() => submitRoute(true)}
                                                disabled={submitting}
                                            >
                                                Vẫn tạo chuyến (bỏ qua cảnh báo)
                                            </Button>
                                        </div>
                                    )}

                                    {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

                                    <div className="flex justify-between pt-2">
                                        <Button variant="outline" onClick={() => setStep(2)}>Quay lại</Button>
                                        <Button onClick={() => submitRoute(false)} disabled={submitting}>
                                            <RouteIcon size={16} className="mr-1" />
                                            {submitting ? 'Đang tạo...' : 'Xác nhận tạo chuyến'}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
