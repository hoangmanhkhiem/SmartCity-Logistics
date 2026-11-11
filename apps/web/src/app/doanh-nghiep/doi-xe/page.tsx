'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { PageHead, StudioShell, orgNav } from '@/components/studio/shell';
import { useAuthStore } from '@/stores/auth-store';
import { useCurrentCarrier } from '@/hooks/use-current-carrier';
import { facilityApi, integrationsApi, vehicleApi, api } from '@/api';
import type { Facility, Vehicle } from '@/types';
import { useToast, getErrorMessage } from '@/components/ui';

type ClientRow = { id: number; name: string; keyPrefix: string; isActive: boolean };

export default function FleetPage() {
    const { showToast } = useToast();
    const { user } = useAuthStore();
    const orgName = user?.memberships?.[0]?.organization?.name || 'Doanh nghiệp';
    const orgId = user?.memberships?.[0]?.organization?.id;
    const { carrier } = useCurrentCarrier();
    const [tab, setTab] = useState('Đội xe');
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
        const text = await file.text();
        try {
            await api.post('/phases/orders/import', { csv: text });
            showToast('Đã gửi CSV (đơn / điểm). Kiểm tra kết quả trên tối ưu tuyến.', 'success');
        } catch (error) {
            showToast(getErrorMessage(error, 'Không nhập được CSV'));
        }
    };

    return (
        <StudioShell group="DOANH NGHIỆP" role="Quản trị DN" items={orgNav}>
            <PageHead title="Đội xe, kho & người dùng" extra={
                <>
                    <input ref={csvRef} type="file" accept=".csv,.geojson,.json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) importCsv(f); e.target.value = ''; }} />
                    <button type="button" className="rounded-lg border bg-white px-3 py-1.5 text-sm" onClick={() => csvRef.current?.click()}>Nhập CSV</button>
                </>
            } />
            <div className="px-6 pb-6">
                <p className="text-sm text-[#56635d]">{orgName}{carrier ? ` · ${carrier.name}` : ''}</p>
                <div className="mt-3 flex gap-4 border-b text-sm">
                    {['Đội xe', 'Kho & điểm', 'Người dùng & API key'].map((item) => (
                        <button key={item} type="button" onClick={() => setTab(item)} className={`pb-2 ${tab === item ? 'border-b-2 border-[#0e6e5c] font-semibold text-[#0e6e5c]' : 'text-[#56635d]'}`}>{item}</button>
                    ))}
                </div>

                {tab === 'Đội xe' && (
                    <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_280px]">
                        <table className="w-full overflow-hidden rounded-2xl bg-white text-sm">
                            <thead className="text-left text-xs text-[#7b8781]"><tr><th className="px-4 py-3">Biển số</th><th>Loại</th><th>Nhiên liệu</th><th>Tải</th><th>Trạng thái</th><th></th></tr></thead>
                            <tbody>
                                {vehicles.map((v) => (
                                    <tr key={v.id} className="border-t">
                                        <td className="px-4 py-3">{v.plate}</td>
                                        <td>{v.type}</td>
                                        <td>{v.fuelType || (v.isElectric ? 'Điện' : '—')}</td>
                                        <td>{v.capacity ?? '—'}</td>
                                        <td>{v.status}</td>
                                        <td><button type="button" className="text-red-700" onClick={async () => { await vehicleApi.delete(v.id); loadVehicles(); }}>Xóa</button></td>
                                    </tr>
                                ))}
                                {vehicles.length === 0 && <tr><td className="px-4 py-3" colSpan={6}>Chưa có xe</td></tr>}
                            </tbody>
                        </table>
                        <form className="h-fit space-y-2 rounded-2xl bg-white p-4 text-sm" onSubmit={addVehicle}>
                            <h2 className="font-semibold">Thêm xe</h2>
                            <label className="block">Biển số<input className="mt-1 w-full rounded border px-2 py-1" value={vForm.plate} onChange={(e) => setVForm({ ...vForm, plate: e.target.value })} required /></label>
                            <label className="block">Loại<select className="mt-1 w-full rounded border px-2 py-1" value={vForm.type} onChange={(e) => setVForm({ ...vForm, type: e.target.value })}><option value="motorbike">Xe máy</option><option value="ebike">Xe điện</option><option value="tricycle">Ba gác</option><option value="van">Tải nhẹ</option></select></label>
                            <label className="block">Nhiên liệu<select className="mt-1 w-full rounded border px-2 py-1" value={vForm.fuelType} onChange={(e) => setVForm({ ...vForm, fuelType: e.target.value })}><option value="gasoline">Xăng</option><option value="electric">Điện</option><option value="diesel">Diesel</option></select></label>
                            <label className="block">Tải (kg)<input className="mt-1 w-full rounded border px-2 py-1" value={vForm.capacity} onChange={(e) => setVForm({ ...vForm, capacity: e.target.value })} /></label>
                            <button className="w-full rounded-lg bg-[#0e6e5c] py-2 text-white" type="submit">Thêm</button>
                        </form>
                    </div>
                )}

                {tab === 'Kho & điểm' && (
                    <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_280px]">
                        <table className="w-full overflow-hidden rounded-2xl bg-white text-sm">
                            <thead className="text-left text-xs text-[#7b8781]"><tr><th className="px-4 py-3">Tên</th><th>Loại</th><th>Địa chỉ</th><th></th></tr></thead>
                            <tbody>
                                {facilities.map((f) => (
                                    <tr key={f.id} className="border-t">
                                        <td className="px-4 py-3">{f.name}</td>
                                        <td>{f.kind}</td>
                                        <td>{f.address || `${f.latitude}, ${f.longitude}`}</td>
                                        <td><button type="button" className="text-red-700" onClick={async () => { await facilityApi.delete(f.id); loadFacilities(); }}>Xóa</button></td>
                                    </tr>
                                ))}
                                {facilities.length === 0 && <tr><td className="px-4 py-3" colSpan={4}>Chưa có điểm</td></tr>}
                            </tbody>
                        </table>
                        <form className="h-fit space-y-2 rounded-2xl bg-white p-4 text-sm" onSubmit={addFacility}>
                            <h2 className="font-semibold">Thêm kho / điểm</h2>
                            <label className="block">Tên<input className="mt-1 w-full rounded border px-2 py-1" value={fForm.name} onChange={(e) => setFForm({ ...fForm, name: e.target.value })} required /></label>
                            <label className="block">Loại<select className="mt-1 w-full rounded border px-2 py-1" value={fForm.kind} onChange={(e) => setFForm({ ...fForm, kind: e.target.value })}><option value="hub">Hub</option><option value="warehouse">Kho</option><option value="mfc">MFC</option><option value="charging_station">Trạm sạc</option></select></label>
                            <label className="block">Địa chỉ<input className="mt-1 w-full rounded border px-2 py-1" value={fForm.address} onChange={(e) => setFForm({ ...fForm, address: e.target.value })} /></label>
                            <div className="grid grid-cols-2 gap-2">
                                <label>Vĩ độ<input className="mt-1 w-full rounded border px-2 py-1" value={fForm.latitude} onChange={(e) => setFForm({ ...fForm, latitude: e.target.value })} /></label>
                                <label>Kinh độ<input className="mt-1 w-full rounded border px-2 py-1" value={fForm.longitude} onChange={(e) => setFForm({ ...fForm, longitude: e.target.value })} /></label>
                            </div>
                            <button className="w-full rounded-lg bg-[#0e6e5c] py-2 text-white" type="submit">Thêm</button>
                        </form>
                    </div>
                )}

                {tab === 'Người dùng & API key' && (
                    <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_280px]">
                        <table className="w-full overflow-hidden rounded-2xl bg-white text-sm">
                            <thead className="text-left text-xs text-[#7b8781]"><tr><th className="px-4 py-3">Tên khoá</th><th>Prefix</th><th>Trạng thái</th><th></th></tr></thead>
                            <tbody>
                                {clients.map((c) => (
                                    <tr key={c.id} className="border-t">
                                        <td className="px-4 py-3">{c.name}</td>
                                        <td>{c.keyPrefix}</td>
                                        <td>{c.isActive ? 'Bật' : 'Thu hồi'}</td>
                                        <td className="space-x-2">
                                            <button type="button" className="text-[#0e6e5c]" onClick={async () => { await integrationsApi.updateApiClient(c.id, { isActive: !c.isActive }); loadKeys(); }}>{c.isActive ? 'Thu hồi' : 'Bật lại'}</button>
                                            <button type="button" className="text-red-700" onClick={async () => { await integrationsApi.deleteApiClient(c.id); loadKeys(); }}>Xóa</button>
                                        </td>
                                    </tr>
                                ))}
                                {clients.length === 0 && <tr><td className="px-4 py-3" colSpan={4}>Chưa có API key</td></tr>}
                            </tbody>
                        </table>
                        <form className="h-fit space-y-2 rounded-2xl bg-white p-4 text-sm" onSubmit={async (e) => {
                            e.preventDefault();
                            try {
                                const res = await integrationsApi.createApiClient(keyName, carrier?.id);
                                setCreatedKey(res.data.apiKey);
                                setKeyName('');
                                loadKeys();
                            } catch (error) { showToast(getErrorMessage(error, 'Không tạo được khoá')); }
                        }}>
                            <h2 className="font-semibold">Tạo API key</h2>
                            <label className="block">Tên đối tác<input className="mt-1 w-full rounded border px-2 py-1" value={keyName} onChange={(e) => setKeyName(e.target.value)} required /></label>
                            <button className="w-full rounded-lg bg-[#0e6e5c] py-2 text-white" type="submit">Tạo</button>
                            {createdKey && <p className="break-all text-xs">Key (chỉ hiện 1 lần): {createdKey}</p>}
                        </form>
                    </div>
                )}
            </div>
        </StudioShell>
    );
}
