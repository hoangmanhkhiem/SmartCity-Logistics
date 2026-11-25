'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { PageHead, StudioShell, orgNav } from '@/components/studio/shell';
import { DataCard } from '@/components/studio/page-ui';
import { useAuthStore } from '@/stores/auth-store';
import { useCurrentCarrier } from '@/hooks/use-current-carrier';
import { facilityApi, integrationsApi, vehicleApi, api } from '@/api';
import Map from '@/components/shared/map';
import type { Facility, Vehicle } from '@/types';
import { DataTable, useToast, getErrorMessage, type Column } from '@/components/ui';

type ClientRow = { id: number; name: string; keyPrefix: string; isActive: boolean };
type Tab = 'Đội xe' | 'Kho & điểm' | 'Người dùng & API key';

const TYPE_LABEL: Record<string, string> = {
    motorbike: 'Xe máy',
    motorcycle: 'Xe máy',
    ebike: 'Xe đạp điện',
    tricycle: 'Xe ba gác',
    van: 'Xe tải nhỏ',
};
const FUEL_LABEL: Record<string, string> = {
    gasoline: 'Xăng',
    electric: 'Điện',
    diesel: 'Diesel',
};

function vehicleStatus(status?: string) {
    if (status === 'available') return { label: 'Sẵn sàng', cls: 'cq-pill green' };
    if (status === 'in_use') return { label: 'Đang chạy', cls: 'cq-pill green' };
    return { label: 'Bảo trì', cls: 'cq-pill orange' };
}

export default function FleetPage() {
    const { showToast } = useToast();
    const { user } = useAuthStore();
    const orgName = user?.memberships?.[0]?.organization?.name || 'Doanh nghiệp';
    const orgId = user?.memberships?.[0]?.organization?.id;
    const { carrier } = useCurrentCarrier();
    const [tab, setTab] = useState<Tab>('Đội xe');
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [facilities, setFacilities] = useState<Facility[]>([]);
    const [clients, setClients] = useState<ClientRow[]>([]);
    const [createdKey, setCreatedKey] = useState('');
    const csvRef = useRef<HTMLInputElement>(null);

    const [vForm, setVForm] = useState({ plate: '', type: 'motorbike', fuelType: 'gasoline', capacity: '30' });
    const [fForm, setFForm] = useState({ name: '', kind: 'hub', address: '', latitude: '21.028', longitude: '105.85', capacity: '50' });
    const [keyName, setKeyName] = useState('');

    const loadVehicles = () => vehicleApi.getAll({ limit: 100, carrierId: carrier?.id }).then((r) => setVehicles(r.data.data ?? r.data)).catch(() => setVehicles([]));
    const loadFacilities = () => facilityApi.getAll({ limit: 100 }).then((r) => setFacilities(r.data.data ?? r.data)).catch(() => setFacilities([]));
    const loadKeys = () => integrationsApi.listApiClients().then((r) => setClients(r.data)).catch(() => setClients([]));

    useEffect(() => { loadVehicles(); loadFacilities(); loadKeys(); }, [carrier?.id]);

    const addVehicle = async (e: FormEvent) => {
        e.preventDefault();
        if (!carrier) { showToast('Tài khoản chưa gắn carrier'); return; }
        try {
            await vehicleApi.create({
                carrierId: carrier.id,
                type: vForm.type,
                plate: vForm.plate,
                fuelType: vForm.fuelType,
                isElectric: vForm.fuelType === 'electric',
                capacity: Number(vForm.capacity) || undefined,
            });
            setVForm({ plate: '', type: 'motorbike', fuelType: 'gasoline', capacity: '30' });
            showToast('Đã thêm xe', 'success');
            loadVehicles();
        } catch (error) { showToast(getErrorMessage(error, 'Không thêm được xe')); }
    };

    const addFacility = async (e: FormEvent) => {
        e.preventDefault();
        if (!orgId) { showToast('Không xác định được tổ chức'); return; }
        try {
            await facilityApi.create({
                organizationId: orgId,
                name: fForm.name,
                kind: fForm.kind,
                address: fForm.address,
                latitude: Number(fForm.latitude),
                longitude: Number(fForm.longitude),
                capacity: Number(fForm.capacity) || undefined,
            });
            setFForm({ name: '', kind: 'hub', address: '', latitude: '21.028', longitude: '105.85', capacity: '50' });
            showToast('Đã thêm kho / điểm', 'success');
            loadFacilities();
        } catch (error) { showToast(getErrorMessage(error, 'Không thêm được điểm')); }
    };

    const importCsv = async (file: File) => {
        try {
            await api.post('/phases/orders/import', { csv: await file.text() });
            showToast('Đã gửi CSV. Kiểm tra kết quả trên tối ưu tuyến.', 'success');
        } catch (error) {
            showToast(getErrorMessage(error, 'Không nhập được CSV'));
        }
    };

    const tabs: Array<{ id: Tab; count?: number }> = [
        { id: 'Đội xe', count: vehicles.length },
        { id: 'Kho & điểm', count: facilities.length },
        { id: 'Người dùng & API key' },
    ];

    return (
        <StudioShell group="DOANH NGHIỆP" role="Quản trị DN" items={orgNav}>
            <PageHead
                title="Đội xe & kho"
                eyebrow="TRUNG TÂM ĐIỀU HÀNH"
                extra={
                    <div className="flex items-center gap-2">
                        <span className="cq-live"><i /> Dữ liệu trực tiếp</span>
                        <input ref={csvRef} type="file" accept=".csv,.geojson,.json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) importCsv(f); e.target.value = ''; }} />
                        <button type="button" className="h-10 rounded-[11px] border border-[#dce3ed] bg-white px-3.5 text-sm font-semibold text-[#33425c]" onClick={() => csvRef.current?.click()}>Nhập CSV</button>
                    </div>
                }
            />
            <p className="mb-3 text-sm text-[#748298]">{orgName}{carrier ? ` / ${carrier.name}` : ''} · Đội xe & kho vận hành</p>

            <div className="flex gap-5 border-b border-[#edf0f5] text-sm">
                {tabs.map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        onClick={() => setTab(item.id)}
                        className={`relative pb-3 font-semibold ${tab === item.id ? 'text-[#087a69]' : 'text-[#75839a]'}`}
                    >
                        {item.id}
                        {item.count != null && <span className="ml-1 text-[12px]">{item.count}</span>}
                        {tab === item.id && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-[#087a69]" />}
                    </button>
                ))}
            </div>

            {tab === 'Đội xe' && (
                <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                    <DataCard title="Đội xe" subtitle={`${vehicles.length} phương tiện`}>
                        <DataTable
                            data={vehicles}
                            emptyMessage="Chưa có xe"
                            columns={[
                                { key: 'plate', header: 'Biển số', render: (v) => <span className="font-semibold text-[#152542]">{v.plate}</span> },
                                { key: 'type', header: 'Loại', render: (v) => TYPE_LABEL[v.type] || v.type },
                                { key: 'fuelType', header: 'Nhiên liệu', render: (v) => FUEL_LABEL[v.fuelType || ''] || (v.isElectric ? 'Điện' : '—') },
                                { key: 'capacity', header: 'Tải / thùng', render: (v) => `${v.payloadKg ?? v.capacity ?? '—'} kg · ${v.cargoM3 ?? v.volume ?? '—'} m³` },
                                { key: 'lezAllowed', header: 'LEZ', render: (v) => v.lezAllowed ? 'Được vào' : 'Cần trung chuyển' },
                                { key: 'status', header: 'Trạng thái', render: (v) => {
                                    const s = vehicleStatus(v.status);
                                    return <span className={s.cls}>{s.label}</span>;
                                } },
                                { key: 'actions', header: '', className: 'text-right', render: (v) => (
                                    <button type="button" className="text-red-600" onClick={async () => { await vehicleApi.delete(v.id); loadVehicles(); }}>Xóa</button>
                                ) },
                            ] satisfies Column<Vehicle>[]}
                        />
                    </DataCard>
                    <form className="h-fit rounded-[16px] border border-[#e6ebf2] bg-white p-5 shadow-[0_8px_30px_rgba(11,27,58,0.045)]" onSubmit={addVehicle}>
                        <div className="flex items-center gap-3">
                            <span className="grid size-10 place-items-center rounded-[11px] bg-[#087a69] text-white"><Plus size={18} /></span>
                            <div>
                                <p className="text-[11px] font-extrabold tracking-wide text-[#8490a5]">PHƯƠNG TIỆN</p>
                                <h2 className="text-[16px] font-bold text-[#152542]">Thêm xe mới</h2>
                            </div>
                        </div>
                        <label className="mt-4 block text-[12px] font-semibold text-[#33425c]">Biển số
                            <input className="mt-1.5 h-10 w-full rounded-[11px] border border-[#dce3ed] px-3" placeholder="VD: 29D3-10006" value={vForm.plate} onChange={(e) => setVForm({ ...vForm, plate: e.target.value })} required />
                        </label>
                        <div className="mt-3 grid grid-cols-2 gap-2">
                            <label className="text-[12px] font-semibold text-[#33425c]">Loại
                                <select className="mt-1.5 h-10 w-full rounded-[11px] border border-[#dce3ed] px-2" value={vForm.type} onChange={(e) => setVForm({ ...vForm, type: e.target.value })}>
                                    <option value="motorbike">Xe máy</option>
                                    <option value="ebike">Xe đạp điện</option>
                                    <option value="van">Xe tải nhỏ</option>
                                    <option value="tricycle">Xe ba gác</option>
                                </select>
                            </label>
                            <label className="text-[12px] font-semibold text-[#33425c]">Nhiên liệu
                                <select className="mt-1.5 h-10 w-full rounded-[11px] border border-[#dce3ed] px-2" value={vForm.fuelType} onChange={(e) => setVForm({ ...vForm, fuelType: e.target.value })}>
                                    <option value="gasoline">Xăng</option>
                                    <option value="electric">Điện</option>
                                    <option value="diesel">Diesel</option>
                                </select>
                            </label>
                        </div>
                        <label className="mt-3 block text-[12px] font-semibold text-[#33425c]">Tải trọng (kg)
                            <input className="mt-1.5 h-10 w-full rounded-[11px] border border-[#dce3ed] px-3" value={vForm.capacity} onChange={(e) => setVForm({ ...vForm, capacity: e.target.value })} />
                        </label>
                        <button className="nc-cta mt-4" type="submit">Thêm phương tiện</button>
                    </form>
                </div>
            )}

            {tab === 'Kho & điểm' && (
                <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                    <DataCard title="Kho & điểm" subtitle={`${facilities.length} địa điểm`}>
                        <DataTable
                            data={facilities}
                            emptyMessage="Chưa có điểm"
                            columns={[
                                { key: 'name', header: 'Tên', render: (f) => <span className="font-semibold text-[#152542]">{f.name}</span> },
                                { key: 'kind', header: 'Loại' },
                                { key: 'address', header: 'Địa chỉ', render: (f) => f.address || `${f.latitude}, ${f.longitude}` },
                                { key: 'actions', header: '', className: 'text-right', render: (f) => (
                                    <button type="button" className="text-red-600" onClick={async () => { await facilityApi.delete(f.id); loadFacilities(); }}>Xóa</button>
                                ) },
                            ] satisfies Column<Facility>[]}
                        />
                    </DataCard>
                    <form className="h-fit rounded-[16px] border border-[#e6ebf2] bg-white p-5" onSubmit={addFacility}>
                        <h2 className="text-[16px] font-bold text-[#152542]">Thêm kho / điểm</h2>
                        <label className="mt-3 block text-[12px] font-semibold">Tên<input className="mt-1.5 h-10 w-full rounded-[11px] border border-[#dce3ed] px-3" value={fForm.name} onChange={(e) => setFForm({ ...fForm, name: e.target.value })} required /></label>
                        <label className="mt-3 block text-[12px] font-semibold">Loại
                            <select className="mt-1.5 h-10 w-full rounded-[11px] border border-[#dce3ed] px-2" value={fForm.kind} onChange={(e) => setFForm({ ...fForm, kind: e.target.value })}>
                                <option value="hub">Hub</option>
                                <option value="warehouse">Kho</option>
                                <option value="mfc">MFC</option>
                                <option value="charging_station">Trạm sạc</option>
                            </select>
                        </label>
                        <label className="mt-3 block text-[12px] font-semibold">Địa chỉ<input className="mt-1.5 h-10 w-full rounded-[11px] border border-[#dce3ed] px-3" value={fForm.address} onChange={(e) => setFForm({ ...fForm, address: e.target.value })} /></label>
                        <div className="mt-3 grid grid-cols-2 gap-2">
                            <label className="text-[12px] font-semibold">Vĩ độ<input className="mt-1.5 h-10 w-full rounded-[11px] border border-[#dce3ed] px-3" value={fForm.latitude} onChange={(e) => setFForm({ ...fForm, latitude: e.target.value })} /></label>
                            <label className="text-[12px] font-semibold">Kinh độ<input className="mt-1.5 h-10 w-full rounded-[11px] border border-[#dce3ed] px-3" value={fForm.longitude} onChange={(e) => setFForm({ ...fForm, longitude: e.target.value })} /></label>
                        </div>
                        <button className="nc-cta mt-4" type="submit">Thêm điểm</button>
                    </form>
                </div>
            )}

            {tab === 'Người dùng & API key' && (
                <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                    <DataCard title="API key" subtitle="Tích hợp B2B">
                        <DataTable
                            data={clients}
                            emptyMessage="Chưa có API key"
                            columns={[
                                { key: 'name', header: 'Tên khoá' },
                                { key: 'keyPrefix', header: 'Prefix' },
                                { key: 'isActive', header: 'Trạng thái', render: (c) => <span className={c.isActive ? 'cq-pill green' : 'cq-pill red'}>{c.isActive ? 'Bật' : 'Thu hồi'}</span> },
                                { key: 'actions', header: '', className: 'text-right', render: (c) => (
                                    <div className="space-x-2">
                                        <button type="button" className="text-[#2f6bff]" onClick={async () => { await integrationsApi.updateApiClient(c.id, { isActive: !c.isActive }); loadKeys(); }}>{c.isActive ? 'Thu hồi' : 'Bật lại'}</button>
                                        <button type="button" className="text-red-600" onClick={async () => { await integrationsApi.deleteApiClient(c.id); loadKeys(); }}>Xóa</button>
                                    </div>
                                ) },
                            ] satisfies Column<ClientRow>[]}
                        />
                    </DataCard>
                    <form className="h-fit rounded-[16px] border border-[#e6ebf2] bg-white p-5" onSubmit={async (e) => {
                        e.preventDefault();
                        try {
                            const res = await integrationsApi.createApiClient(keyName, carrier?.id);
                            setCreatedKey(res.data.apiKey);
                            setKeyName('');
                            loadKeys();
                        } catch (error) { showToast(getErrorMessage(error, 'Không tạo được khoá')); }
                    }}>
                        <h2 className="text-[16px] font-bold text-[#152542]">Tạo API key</h2>
                        <label className="mt-3 block text-[12px] font-semibold">Tên đối tác<input className="mt-1.5 h-10 w-full rounded-[11px] border border-[#dce3ed] px-3" value={keyName} onChange={(e) => setKeyName(e.target.value)} required /></label>
                        <button className="nc-cta mt-4" type="submit">Tạo</button>
                        {createdKey && <p className="mt-2 break-all text-xs">Key (chỉ hiện 1 lần): {createdKey}</p>}
                    </form>
                </div>
            )}

            <DataCard className="mt-4" title="Bản đồ kho & điểm" subtitle="Vị trí vận hành trên bản đồ thành phố">
                <div className="dn-map px-4 pb-4">
                    <Map
                        className="h-full w-full rounded-[12px]"
                        center={[105.84, 21.03]}
                        zoom={13}
                        showZonesAndRestrictions
                        markers={facilities
                            .filter((f) => Number.isFinite(f.longitude) && Number.isFinite(f.latitude))
                            .map((f) => ({
                                id: f.id,
                                coordinates: [f.longitude, f.latitude] as [number, number],
                                type: (f.kind as 'warehouse' | 'hub' | 'charging_station') || 'warehouse',
                                label: f.name,
                                popup: f.address || f.name,
                            }))}
                    />
                </div>
            </DataCard>
        </StudioShell>
    );
}
