'use client';

import { FormEvent, useEffect, useState } from 'react';
import { api } from '@/api';
import { Button, Card, CardBody, Input } from '@/components/ui';

type Factor = { id: number; vehicleType: string; fuelType: string; gCo2ePerKm: string; sourceRef: string | null };

export default function EmissionsPage() {
    const [rows, setRows] = useState<Factor[]>([]);
    const [editing, setEditing] = useState<number | null>(null);
    const [form, setForm] = useState({ vehicleType: 'motorbike_ice', fuelType: 'gasoline', gCo2ePerKm: '72', sourceRef: '' });

    const load = () => api.get('/emission-factors').then((r) => setRows(r.data));
    useEffect(() => { load(); }, []);

    async function save(e: FormEvent) {
        e.preventDefault();
        const body = { ...form, gCo2ePerKm: Number(form.gCo2ePerKm) };
        if (editing) await api.patch(`/emission-factors/${editing}`, body);
        else await api.post('/emission-factors', body);
        setEditing(null);
        setForm({ vehicleType: '', fuelType: '', gCo2ePerKm: '', sourceRef: '' });
        load();
    }

    return (
        <div className="space-y-4">
            <h1 className="text-xl font-semibold">Hệ số phát thải CO₂e</h1>
            <p className="text-sm text-slate-500">Đơn vị gCO₂e/km theo loại xe và nhiên liệu. Quản trị và cơ quan quản lý được sửa.</p>
            <Card>
                <CardBody>
                    <form onSubmit={save} className="grid gap-3 md:grid-cols-5">
                        <Input placeholder="Loại xe" value={form.vehicleType} onChange={(e) => setForm({ ...form, vehicleType: e.target.value })} />
                        <Input placeholder="Nhiên liệu" value={form.fuelType} onChange={(e) => setForm({ ...form, fuelType: e.target.value })} />
                        <Input placeholder="gCO₂e/km" value={form.gCo2ePerKm} onChange={(e) => setForm({ ...form, gCo2ePerKm: e.target.value })} />
                        <Input placeholder="Nguồn" value={form.sourceRef} onChange={(e) => setForm({ ...form, sourceRef: e.target.value })} />
                        <Button type="submit">{editing ? 'Cập nhật' : 'Thêm'}</Button>
                    </form>
                </CardBody>
            </Card>
            <table className="w-full text-sm">
                <thead>
                    <tr className="text-left text-slate-500">
                        <th>Loại xe</th><th>Nhiên liệu</th><th>gCO₂e/km</th><th>Nguồn</th><th></th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <tr key={row.id} className="border-t">
                            <td className="py-2">{row.vehicleType}</td>
                            <td>{row.fuelType}</td>
                            <td>{row.gCo2ePerKm}</td>
                            <td>{row.sourceRef}</td>
                            <td className="space-x-2">
                                <button className="text-indigo-600" onClick={() => { setEditing(row.id); setForm({ vehicleType: row.vehicleType, fuelType: row.fuelType, gCo2ePerKm: String(row.gCo2ePerKm), sourceRef: row.sourceRef ?? '' }); }}>Sửa</button>
                                <button className="text-red-600" onClick={async () => { await api.delete(`/emission-factors/${row.id}`); load(); }}>Xóa</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
