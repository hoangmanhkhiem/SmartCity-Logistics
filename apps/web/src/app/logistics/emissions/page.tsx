'use client';

import { FormEvent, useEffect, useState } from 'react';
import { api } from '@/api';
import { PageHead } from '@/components/studio/shell';
import { DataTable, type Column } from '@/components/ui';
import { DataCard } from '@/components/studio/page-ui';

type Factor = { id: number; vehicleType: string; fuelType: string; gCo2ePerKm: string; sourceRef: string | null };

export default function EmissionsPage() {
    const [rows, setRows] = useState<Factor[]>([]);
    const [editing, setEditing] = useState<number | null>(null);
    const [form, setForm] = useState({ vehicleType: 'motorbike_ice', fuelType: 'gasoline', gCo2ePerKm: '72', sourceRef: '' });
    const [message, setMessage] = useState('');

    const load = () => api.get('/emission-factors').then((r) => setRows(r.data));
    useEffect(() => { load(); }, []);

    async function save(e: FormEvent) {
        e.preventDefault();
        const body = { ...form, gCo2ePerKm: Number(form.gCo2ePerKm) };
        try {
            if (editing) await api.patch(`/emission-factors/${editing}`, body);
            else await api.post('/emission-factors', body);
            setEditing(null);
            setForm({ vehicleType: 'motorbike_ice', fuelType: 'gasoline', gCo2ePerKm: '72', sourceRef: '' });
            setMessage('Đã lưu hệ số.');
            load();
        } catch {
            setMessage('Không lưu được.');
        }
    }

    return (
        <>
            <PageHead title="Hệ số phát thải CO₂e" />
            <div className="space-y-4">
                <form onSubmit={save} className="grid gap-3 rounded-2xl bg-white p-4 text-sm md:grid-cols-5">
                    <input className="rounded border px-2 py-1" placeholder="Loại xe" value={form.vehicleType} onChange={(e) => setForm({ ...form, vehicleType: e.target.value })} />
                    <input className="rounded border px-2 py-1" placeholder="Nhiên liệu" value={form.fuelType} onChange={(e) => setForm({ ...form, fuelType: e.target.value })} />
                    <input className="rounded border px-2 py-1" placeholder="gCO₂e/km" value={form.gCo2ePerKm} onChange={(e) => setForm({ ...form, gCo2ePerKm: e.target.value })} />
                    <input className="rounded border px-2 py-1" placeholder="Nguồn" value={form.sourceRef} onChange={(e) => setForm({ ...form, sourceRef: e.target.value })} />
                    <button className="rounded-lg bg-[#0e6e5c] py-2 text-white" type="submit">{editing ? 'Cập nhật' : 'Thêm'}</button>
                </form>
                {message && <p className="text-sm">{message}</p>}
                <DataCard>
                    <DataTable
                        data={rows}
                        emptyMessage="Chưa có hệ số"
                        columns={[
                            { key: 'vehicleType', header: 'Loại xe' },
                            { key: 'fuelType', header: 'Nhiên liệu' },
                            { key: 'gCo2ePerKm', header: 'gCO₂e/km' },
                            { key: 'sourceRef', header: 'Nguồn', render: (row) => row.sourceRef || '—' },
                            { key: 'actions', header: '', render: (row) => (
                                <div className="space-x-2">
                                    <button className="text-[#2f6bff]" type="button" onClick={() => { setEditing(row.id); setForm({ vehicleType: row.vehicleType, fuelType: row.fuelType, gCo2ePerKm: String(row.gCo2ePerKm), sourceRef: row.sourceRef ?? '' }); }}>Sửa</button>
                                    <button className="text-red-700" type="button" onClick={async () => { await api.delete(`/emission-factors/${row.id}`); load(); }}>Xóa</button>
                                </div>
                            ) },
                        ] satisfies Column<Factor>[]}
                    />
                </DataCard>
            </div>
        </>
    );
}
