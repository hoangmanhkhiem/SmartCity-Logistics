'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, CardBody, CardHeader, Badge, Button, Select, Input, Modal, ConfirmDialog, useToast, getErrorMessage } from '@/components/ui';
import { restrictionApi, roadSegmentApi, zoneApi } from '@/lib/api';
import { Settings, Clock, Truck, MapPin, Plus, RefreshCw, PenLine, Edit, Trash2 } from 'lucide-react';
import type { Zone } from '@/types';
import { normalizeRestrictionFeatureCollection } from '@/lib/geojson-lnglat';
import Map from '@/components/shared/map';

type GeoJsonFC = GeoJSON.FeatureCollection;

function toLocalDatetimeValue(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface RestrictionMapEditorProps {
    /** Regulator = chỉ xem (không có form tạo mới, không vẽ). Admin = có đầy đủ quyền sửa + vẽ. */
    readOnly?: boolean;
}

export default function RestrictionMapEditor({ readOnly = false }: RestrictionMapEditorProps) {
    const { showToast } = useToast();
    const [restrictions, setRestrictions] = useState<Record<string, unknown>[]>([]);
    const [zones, setZones] = useState<Zone[]>([]);
    const [loading, setLoading] = useState(true);
    const [mapLoading, setMapLoading] = useState(false);
    const [at, setAt] = useState(() => toLocalDatetimeValue(new Date()));
    const [vehicleType, setVehicleType] = useState('');
    const [geoJson, setGeoJson] = useState<GeoJsonFC | null>(null);

    const [modalOpen, setModalOpen] = useState(false);
    const [drawnLine, setDrawnLine] = useState<GeoJSON.LineString | null>(null);
    const [roadForm, setRoadForm] = useState({ name: '', zoneId: '' });
    const [restrictionForm, setRestrictionForm] = useState({
        timeFrom: '07:00',
        timeTo: '09:00',
        daysOfWeek: 'Mon,Tue,Wed,Thu,Fri',
        severity: 'restricted',
        description: '',
        vehicleTypes: 'truck',
    });

    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingRestriction, setEditingRestriction] = useState<Record<string, unknown> | null>(null);
    const [editForm, setEditForm] = useState({
        timeFrom: '',
        timeTo: '',
        daysOfWeek: '',
        severity: 'restricted',
        description: '',
        vehicleTypes: '',
    });
    const [editRoadName, setEditRoadName] = useState('');
    const [editDrawnLine, setEditDrawnLine] = useState<GeoJSON.LineString | null>(null);
    const [creating, setCreating] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [deletingRestriction, setDeletingRestriction] = useState<Record<string, unknown> | null>(null);
    const [deleting, setDeleting] = useState(false);

    const loadList = useCallback(async () => {
        try {
            const res = await restrictionApi.getAll();
            setRestrictions((res.data as Record<string, unknown>[]) || []);
        } catch (error) {
            setRestrictions([]);
            showToast(getErrorMessage(error, 'Không tải được danh sách quy định hạn chế'));
        }
    }, [showToast]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                const [zRes] = await Promise.all([zoneApi.getAll({ limit: 100 }), loadList()]);
                if (!cancelled) {
                    const zd = zRes.data as { data?: Zone[] };
                    setZones(zd.data ?? []);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [loadList]);

    const fetchGeo = useCallback(async () => {
        const iso = new Date(at);
        if (Number.isNaN(iso.getTime())) return;
        setMapLoading(true);
        try {
            const res = await restrictionApi.getActiveGeoJson({
                at: iso.toISOString(),
                ...(vehicleType ? { vehicleType } : {}),
            });
            const raw = res.data as GeoJsonFC;
            setGeoJson(normalizeRestrictionFeatureCollection(raw) as GeoJsonFC);
        } catch {
            setGeoJson({ type: 'FeatureCollection', features: [] });
        } finally {
            setMapLoading(false);
        }
    }, [at, vehicleType]);

    useEffect(() => {
        fetchGeo();
    }, [fetchGeo]);

    const handleDrawComplete = (feature: GeoJSON.Feature) => {
        if (feature.geometry.type === 'LineString') {
            setDrawnLine(feature.geometry);
        }
    };

    const handleCreateChain = async (e: React.FormEvent) => {
        e.preventDefault();
        if (creating) return;
        if (!drawnLine) {
            showToast('Vẽ đoạn đường trên bản đồ trước khi tạo quy định');
            return;
        }
        setCreating(true);
        try {
            const roadRes = await roadSegmentApi.create({
                name: roadForm.name,
                zoneId: roadForm.zoneId || undefined,
                geometry: JSON.stringify(drawnLine),
            });
            const road = roadRes.data as { id: string };
            const days = restrictionForm.daysOfWeek.split(',').map((s) => s.trim()).filter(Boolean);
            const vtypes = restrictionForm.vehicleTypes.split(',').map((s) => s.trim()).filter(Boolean);
            await restrictionApi.create({
                roadSegmentId: road.id,
                zoneId: roadForm.zoneId || undefined,
                timeFrom: restrictionForm.timeFrom,
                timeTo: restrictionForm.timeTo,
                daysOfWeek: days,
                severity: restrictionForm.severity,
                description: restrictionForm.description || undefined,
                vehicleTypes: vtypes.length ? vtypes : undefined,
            });
            setModalOpen(false);
            setDrawnLine(null);
            setRoadForm({ name: '', zoneId: '' });
            showToast('Đã tạo quy định hạn chế', 'success');
            await loadList();
            await fetchGeo();
        } catch (error) {
            showToast(getErrorMessage(error, 'Không thể tạo quy định hạn chế'));
        } finally {
            setCreating(false);
        }
    };

    const handleOpenEdit = (r: Record<string, unknown>) => {
        const x = r as {
            timeFrom?: string;
            timeTo?: string;
            daysOfWeek?: string[];
            severity?: string;
            description?: string;
            vehicleTypes?: string[];
            roadSegment?: { name?: string; geometry?: string };
        };
        setEditingRestriction(r);
        setEditForm({
            timeFrom: x.timeFrom || '',
            timeTo: x.timeTo || '',
            daysOfWeek: (x.daysOfWeek || []).join(','),
            severity: x.severity || 'restricted',
            description: x.description || '',
            vehicleTypes: (x.vehicleTypes || []).join(','),
        });
        setEditRoadName(x.roadSegment?.name || '');
        try {
            setEditDrawnLine(x.roadSegment?.geometry ? (JSON.parse(x.roadSegment.geometry) as GeoJSON.LineString) : null);
        } catch {
            setEditDrawnLine(null);
        }
        setEditModalOpen(true);
    };

    const handleEditDrawComplete = (feature: GeoJSON.Feature) => {
        if (feature.geometry.type === 'LineString') {
            setEditDrawnLine(feature.geometry);
        }
    };

    const handleUpdateRestriction = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingRestriction || updating) return;
        setUpdating(true);
        try {
            const x = editingRestriction as { id: string; roadSegment?: { id?: string } };
            const days = editForm.daysOfWeek.split(',').map((s) => s.trim()).filter(Boolean);
            const vtypes = editForm.vehicleTypes.split(',').map((s) => s.trim()).filter(Boolean);
            if (x.roadSegment?.id) {
                await roadSegmentApi.update(Number(x.roadSegment.id), {
                    name: editRoadName || undefined,
                    ...(editDrawnLine && { geometry: JSON.stringify(editDrawnLine) }),
                });
            }
            await restrictionApi.update(Number(x.id), {
                timeFrom: editForm.timeFrom || undefined,
                timeTo: editForm.timeTo || undefined,
                daysOfWeek: days,
                severity: editForm.severity,
                description: editForm.description || undefined,
                vehicleTypes: vtypes.length ? vtypes : undefined,
            });
            setEditModalOpen(false);
            setEditingRestriction(null);
            showToast('Đã cập nhật quy định hạn chế', 'success');
            await loadList();
            await fetchGeo();
        } catch (error) {
            showToast(getErrorMessage(error, 'Không thể cập nhật quy định hạn chế'));
        } finally {
            setUpdating(false);
        }
    };

    const handleDeleteRestriction = async () => {
        if (!deletingRestriction) return;
        setDeleting(true);
        try {
            const id = (deletingRestriction as { id: string }).id;
            await restrictionApi.delete(Number(id));
            setDeletingRestriction(null);
            showToast('Đã xóa quy định hạn chế', 'success');
            await loadList();
            await fetchGeo();
        } catch (error) {
            showToast(getErrorMessage(error, 'Không thể xóa quy định hạn chế'));
        } finally {
            setDeleting(false);
        }
    };

    const vehicleOptions = [
        { value: '', label: 'Mọi loại xe (hiển thị)' },
        { value: 'truck', label: 'Xe tải' },
        { value: 'van', label: 'Van' },
        { value: 'bike', label: 'Xe máy' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                        {readOnly ? 'Quy định hạn chế & cấm đường' : 'Quản lý cấm đường'}
                    </h1>
                    <p className="mt-1 text-slate-500">
                        Theo khung giờ (Asia/Ho_Chi_Minh) — tuyến đỏ: cấm, cam: hạn chế, xanh: khung được phép
                    </p>
                </div>
                {!readOnly && (
                    <Button onClick={() => setModalOpen(true)}>
                        <Plus size={18} className="mr-1" />
                        Thêm đoạn đường & quy định
                    </Button>
                )}
            </div>

            <Card>
                <CardHeader>
                    <h2 className="text-lg font-semibold">Mô phỏng theo thời điểm</h2>
                </CardHeader>
                <CardBody className="flex flex-wrap gap-4 items-end">
                    <div>
                        <label className="mb-1 block text-sm text-slate-600">Thời điểm xem</label>
                        <Input type="datetime-local" value={at} onChange={(e) => setAt(e.target.value)} />
                    </div>
                    <div className="w-48">
                        <label className="mb-1 block text-sm text-slate-600">Loại xe (lọc)</label>
                        <Select options={vehicleOptions} value={vehicleType} onChange={(v) => setVehicleType(v)} />
                    </div>
                    <Button variant="outline" onClick={() => fetchGeo()} disabled={mapLoading}>
                        <RefreshCw size={16} className={`mr-1 ${mapLoading ? 'animate-spin' : ''}`} />
                        Tải lại lớp bản đồ
                    </Button>
                </CardBody>
            </Card>

            <Card>
                <CardBody className="p-0">
                    <div className="h-[420px] w-full overflow-hidden rounded-b-lg">
                        <Map restrictionsGeoJson={geoJson as never} zoom={11} />
                    </div>
                    <p className="p-3 text-xs text-slate-500">
                        Nguồn: GET /restrictions/active/geojson — {geoJson?.features?.length ?? 0} đoạn hiển thị
                    </p>
                </CardBody>
            </Card>

            <div className="grid grid-cols-3 gap-4">
                <Card>
                    <CardBody className="flex items-center gap-3">
                        <div className="rounded-xl bg-orange-100 p-3">
                            <Clock size={24} className="text-orange-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{restrictions.filter((r) => (r as { timeFrom?: string }).timeFrom).length}</p>
                            <p className="text-sm text-slate-500">Có khung giờ</p>
                        </div>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="flex items-center gap-3">
                        <div className="rounded-xl bg-green-100 p-3">
                            <Settings size={24} className="text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{restrictions.length}</p>
                            <p className="text-sm text-slate-500">Tổng quy định</p>
                        </div>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="flex items-center gap-3">
                        <div className="rounded-xl bg-indigo-100 p-3">
                            <Truck size={24} className="text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">
                                {loading ? '…' : restrictions.filter((r) => (r as { vehicleTypes?: string[] }).vehicleTypes?.length).length}
                            </p>
                            <p className="text-sm text-slate-500">Theo loại xe</p>
                        </div>
                    </CardBody>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <h2 className="text-lg font-semibold">Danh sách quy định (API)</h2>
                </CardHeader>
                <CardBody className="space-y-3">
                    {loading ? (
                        <p className="text-sm text-slate-500">Đang tải…</p>
                    ) : restrictions.length === 0 ? (
                        <p className="text-sm text-slate-500">Chưa có dữ liệu hoặc không có quyền đọc.</p>
                    ) : (
                        restrictions.map((r) => {
                            const x = r as {
                                id: string;
                                description?: string;
                                timeFrom?: string;
                                timeTo?: string;
                                daysOfWeek?: string[];
                                severity?: string;
                                zone?: { name?: string };
                                vehicleTypes?: string[];
                            };
                            const vt = x.vehicleTypes?.length ? x.vehicleTypes.join(', ') : 'mọi xe';
                            return (
                                <div key={x.id} className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`h-10 w-2 rounded-full ${
                                                    x.severity === 'prohibited'
                                                        ? 'bg-red-600'
                                                        : x.severity === 'allowed_window'
                                                          ? 'bg-green-600'
                                                          : 'bg-orange-500'
                                                }`}
                                            />
                                            <div>
                                                <h3 className="font-semibold text-slate-800 dark:text-white">
                                                    {x.description || 'Quy định'}
                                                </h3>
                                                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                                                    <MapPin size={14} /> {x.zone?.name || '—'}
                                                    <span className="mx-1">•</span>
                                                    <Badge variant="secondary">{x.severity || 'restricted'}</Badge>
                                                </div>
                                            </div>
                                        </div>
                                        {!readOnly && (
                                            <div className="flex gap-1">
                                                <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(r)}>
                                                    <Edit size={16} />
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => setDeletingRestriction(r)}>
                                                    <Trash2 size={16} className="text-red-500" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-4 pl-6 text-sm text-slate-600">
                                        {x.timeFrom && (
                                            <span>
                                                <Clock size={14} className="mr-1 inline" />
                                                {x.timeFrom} – {x.timeTo}
                                            </span>
                                        )}
                                        <span>
                                            <Truck size={14} className="mr-1 inline" />
                                            {vt}
                                        </span>
                                        {x.daysOfWeek?.length ? <span>{x.daysOfWeek.join(', ')}</span> : null}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </CardBody>
            </Card>

            {!readOnly && (
                <Modal
                    isOpen={modalOpen}
                    onClose={() => {
                        setModalOpen(false);
                        setDrawnLine(null);
                    }}
                    title="Thêm đoạn đường + quy định"
                    size="lg"
                >
                    <form onSubmit={handleCreateChain} className="space-y-4">
                        <p className="flex items-center gap-2 text-sm text-slate-600">
                            <PenLine size={16} />
                            Bước 1: Vẽ đoạn đường trên bản đồ (click nối các điểm, double-click để kết thúc). Bước 2: khung giờ áp dụng.
                        </p>
                        <Input
                            label="Tên đường / đoạn"
                            value={roadForm.name}
                            onChange={(e) => setRoadForm({ ...roadForm, name: e.target.value })}
                            required
                        />
                        <Select
                            label="Khu vực (tuỳ chọn)"
                            options={[{ value: '', label: '—' }, ...zones.map((z) => ({ value: String(z.id), label: z.name }))]}
                            value={roadForm.zoneId}
                            onChange={(v) => setRoadForm({ ...roadForm, zoneId: v })}
                        />
                        <div>
                            <label className="mb-1 block text-sm text-slate-600">
                                Vẽ đoạn đường trên bản đồ {drawnLine ? `(đã vẽ ${drawnLine.coordinates.length} điểm)` : '(chưa vẽ)'}
                            </label>
                            <div className="h-[300px] w-full overflow-hidden rounded-lg border border-slate-300 dark:border-slate-600">
                                <Map drawMode="line" onDrawComplete={handleDrawComplete} zoom={13} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Từ (HH:mm)"
                                value={restrictionForm.timeFrom}
                                onChange={(e) => setRestrictionForm({ ...restrictionForm, timeFrom: e.target.value })}
                            />
                            <Input
                                label="Đến (HH:mm)"
                                value={restrictionForm.timeTo}
                                onChange={(e) => setRestrictionForm({ ...restrictionForm, timeTo: e.target.value })}
                            />
                        </div>
                        <Input
                            label="Ngày trong tuần (Mon,Tue,...)"
                            value={restrictionForm.daysOfWeek}
                            onChange={(e) => setRestrictionForm({ ...restrictionForm, daysOfWeek: e.target.value })}
                        />
                        <Select
                            label="Mức độ (màu)"
                            options={[
                                { value: 'prohibited', label: 'Cấm (đỏ)' },
                                { value: 'restricted', label: 'Hạn chế (cam)' },
                                { value: 'allowed_window', label: 'Khung được (xanh)' },
                            ]}
                            value={restrictionForm.severity}
                            onChange={(v) => setRestrictionForm({ ...restrictionForm, severity: v })}
                        />
                        <Input
                            label="Loại xe (phân tách bằng dấu phẩy, để trống = mọi xe)"
                            value={restrictionForm.vehicleTypes}
                            onChange={(e) => setRestrictionForm({ ...restrictionForm, vehicleTypes: e.target.value })}
                        />
                        <Input
                            label="Mô tả"
                            value={restrictionForm.description}
                            onChange={(e) => setRestrictionForm({ ...restrictionForm, description: e.target.value })}
                        />
                        <div className="flex justify-end gap-2 border-t pt-4">
                            <Button type="button" variant="outline" onClick={() => setModalOpen(false)} disabled={creating}>
                                Hủy
                            </Button>
                            <Button type="submit" isLoading={creating}>Tạo</Button>
                        </div>
                    </form>
                </Modal>
            )}

            {!readOnly && (
                <Modal
                    isOpen={editModalOpen}
                    onClose={() => {
                        setEditModalOpen(false);
                        setEditingRestriction(null);
                    }}
                    title="Sửa quy định hạn chế"
                    size="lg"
                >
                    <form onSubmit={handleUpdateRestriction} className="space-y-4">
                        <Input
                            label="Tên đường / đoạn"
                            value={editRoadName}
                            onChange={(e) => setEditRoadName(e.target.value)}
                        />
                        <div>
                            <label className="mb-1 flex items-center gap-2 text-sm text-slate-600">
                                <PenLine size={16} />
                                Vẽ lại đoạn đường trên bản đồ (tuỳ chọn) {editDrawnLine ? `— đã có ${editDrawnLine.coordinates.length} điểm` : '— chưa có hình học'}
                            </label>
                            <div className="h-[300px] w-full overflow-hidden rounded-lg border border-slate-300 dark:border-slate-600">
                                <Map
                                    drawMode="line"
                                    onDrawComplete={handleEditDrawComplete}
                                    initialDrawFeature={editDrawnLine ? { type: 'Feature', properties: {}, geometry: editDrawnLine } : null}
                                    zoom={13}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Từ (HH:mm)"
                                value={editForm.timeFrom}
                                onChange={(e) => setEditForm({ ...editForm, timeFrom: e.target.value })}
                            />
                            <Input
                                label="Đến (HH:mm)"
                                value={editForm.timeTo}
                                onChange={(e) => setEditForm({ ...editForm, timeTo: e.target.value })}
                            />
                        </div>
                        <Input
                            label="Ngày trong tuần (Mon,Tue,...)"
                            value={editForm.daysOfWeek}
                            onChange={(e) => setEditForm({ ...editForm, daysOfWeek: e.target.value })}
                        />
                        <Select
                            label="Mức độ (màu)"
                            options={[
                                { value: 'prohibited', label: 'Cấm (đỏ)' },
                                { value: 'restricted', label: 'Hạn chế (cam)' },
                                { value: 'allowed_window', label: 'Khung được (xanh)' },
                            ]}
                            value={editForm.severity}
                            onChange={(v) => setEditForm({ ...editForm, severity: v })}
                        />
                        <Input
                            label="Loại xe (phân tách bằng dấu phẩy, để trống = mọi xe)"
                            value={editForm.vehicleTypes}
                            onChange={(e) => setEditForm({ ...editForm, vehicleTypes: e.target.value })}
                        />
                        <Input
                            label="Mô tả"
                            value={editForm.description}
                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        />
                        <div className="flex justify-end gap-2 border-t pt-4">
                            <Button type="button" variant="outline" onClick={() => setEditModalOpen(false)} disabled={updating}>
                                Hủy
                            </Button>
                            <Button type="submit" isLoading={updating}>Cập nhật</Button>
                        </div>
                    </form>
                </Modal>
            )}

            <ConfirmDialog
                isOpen={!!deletingRestriction}
                title="Xóa quy định hạn chế"
                message="Bạn có chắc muốn xóa quy định hạn chế này? Hành động này không thể hoàn tác."
                loading={deleting}
                onConfirm={handleDeleteRestriction}
                onCancel={() => setDeletingRestriction(null)}
            />
        </div>
    );
}
