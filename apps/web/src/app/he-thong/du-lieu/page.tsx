'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { api } from '@/api';
import { PageHead, StudioShell, adminNav } from '@/components/studio/shell';
import { useToast, getErrorMessage } from '@/components/ui';

type Quota = { used: number; limit: number; stopped: boolean; note: string };
type Job = { id: number; type: string; status: string; createdAt?: string };
type Factor = { id: number; vehicleType: string; fuelType: string; gCo2ePerKm: string };

export default function SystemDataPage() {
    const { showToast } = useToast();
    const zoneFile = useRef<HTMLInputElement>(null);
    const [quota, setQuota] = useState<Quota | null>(null);
    const [jobs, setJobs] = useState<Job[]>([]);
    const [health, setHealth] = useState('');
    const [factors, setFactors] = useState<Factor[]>([]);
    const [message, setMessage] = useState('');

    const load = () => {
        api.get('/traffic/quota').then((r) => setQuota(r.data)).catch(() => undefined);
        api.get('/jobs').then((r) => setJobs(r.data ?? [])).catch(() => setJobs([]));
        api.get('/health').then((r) => setHealth(r.data?.status || 'ok')).catch(() => setHealth('down'));
        api.get('/emission-factors').then((r) => setFactors(r.data ?? [])).catch(() => undefined);
    };
    useEffect(() => { load(); }, []);

    const importZones = async (file: File) => {
        try {
            const geo = JSON.parse(await file.text());
            const features = geo.features ?? (geo.type === 'Polygon' ? [{ geometry: geo, properties: { name: file.name } }] : []);
            let n = 0;
            for (const f of features) {
                if (f.geometry?.type !== 'Polygon') continue;
                await api.post('/zones', { name: f.properties?.name || `Vùng ${++n}`, type: 'district', boundary: JSON.stringify(f.geometry) });
                n += 1;
            }
            showToast(`Đã nhập ${n} ranh giới`, 'success');
        } catch (error) {
            showToast(getErrorMessage(error, 'Không nhập được GeoJSON'));
        }
    };

    return (
        <StudioShell group="QUẢN TRỊ HỆ THỐNG" role="Quản trị hệ thống" items={adminNav}>
            <PageHead title="Dữ liệu nền & hệ thống" />
            <div className="space-y-4 px-6 pb-6">
                <div className="grid gap-3 md:grid-cols-4">
                    <article className="rounded-2xl bg-white p-4 text-sm">
                        <h2 className="font-semibold">Ranh giới phường</h2>
                        <p className="mt-1 text-xs text-[#56635d]">GeoJSON Polygon EPSG:4326</p>
                        <input ref={zoneFile} type="file" accept=".json,.geojson" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) importZones(f); e.target.value = ''; }} />
                        <button type="button" className="mt-3 rounded-lg border px-2 py-1 text-xs" onClick={() => zoneFile.current?.click()}>Nhập file mới</button>
                    </article>
                    <article className="rounded-2xl bg-white p-4 text-sm">
                        <h2 className="font-semibold">OSM / TomTom</h2>
                        <p className="mt-2 text-xs">{quota ? `${quota.used}/${quota.limit} lượt · ${quota.stopped ? 'đã dừng 90%' : 'còn hạn mức'}` : 'Đang đọc hạn mức'}</p>
                        <button type="button" className="mt-3 text-xs text-[#0e6e5c]" onClick={() => api.post('/traffic/sample').then(() => setMessage('Đã lấy mẫu.')).catch(() => setMessage('Cần đăng nhập quản trị.'))}>Lấy mẫu giao thông</button>
                    </article>
                    <article className="rounded-2xl bg-white p-4 text-sm">
                        <h2 className="font-semibold">Hệ số phát thải</h2>
                        <p className="mt-1 text-xs text-[#56635d]">{factors.length} hệ số</p>
                        <Link href="/logistics/emissions" className="mt-3 inline-block text-xs text-[#0e6e5c]">Sửa danh mục</Link>
                    </article>
                    <article className="rounded-2xl bg-white p-4 text-sm">
                        <h2 className="font-semibold">Khảo sát</h2>
                        <Link href="/nghien-cuu" className="mt-3 inline-block text-xs text-[#0e6e5c]">Duyệt phiếu</Link>
                    </article>
                </div>
                <section className="rounded-2xl bg-white p-4 text-sm">
                    <h2 className="font-semibold">Công việc nền</h2>
                    <table className="mt-2 w-full">
                        <thead className="text-left text-xs text-[#7b8781]"><tr><th className="py-2">Job</th><th>Trạng thái</th><th>Bắt đầu</th></tr></thead>
                        <tbody>
                            {jobs.map((j) => <tr key={j.id} className="border-t"><td className="py-2">{j.type} #{j.id}</td><td>{j.status}</td><td>{j.createdAt ? new Date(j.createdAt).toLocaleString('vi-VN') : '—'}</td></tr>)}
                            {jobs.length === 0 && <tr><td className="py-2" colSpan={3}>Chưa có job. Lấy mẫu giao thông để tạo.</td></tr>}
                        </tbody>
                    </table>
                    {message && <p className="mt-2 text-xs">{message}</p>}
                    {quota && <p className="mt-2 text-xs text-[#56635d]">{quota.note}</p>}
                </section>
                <section className="rounded-2xl bg-white p-4 text-sm">
                    <h2 className="font-semibold">Dịch vụ</h2>
                    <div className="mt-3 flex flex-wrap gap-4 text-xs">
                        {[['api', health === 'ok'], ['web', true], ['mysql', health === 'ok']].map(([name, ok]) => (
                            <span key={String(name)} className="flex items-center gap-1"><span className={`h-2 w-2 rounded-full ${ok ? 'bg-[#16a34a]' : 'bg-red-500'}`} />{String(name)}</span>
                        ))}
                    </div>
                </section>
            </div>
        </StudioShell>
    );
}
