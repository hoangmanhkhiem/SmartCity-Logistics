'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { api } from '@/api';
import { PageHead } from '@/components/studio/shell';
import { DataCard, MetricStat, SoftTag } from '@/components/studio/page-ui';
import { Button, DataTable, useToast, getErrorMessage, type Column } from '@/components/ui';
import { Activity, Database, Leaf, MapPinned } from 'lucide-react';

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
        <div className="space-y-6">
            <PageHead
                title="Dữ liệu & hệ thống"
                description="Nhập ranh giới, theo dõi hạn mức dữ liệu nền và sức khỏe dịch vụ."
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <MetricStat title="Hệ số phát thải" value={factors.length} icon={<Leaf size={17} />} tone="blue" />
                <MetricStat title="Job nền" value={jobs.length} icon={<Database size={17} />} tone="navy" />
                <MetricStat title="Quota giao thông" value={quota ? `${quota.used}/${quota.limit}` : '—'} icon={<Activity size={17} />} tone="orange" />
                <MetricStat title="API" value={health || '…'} icon={<MapPinned size={17} />} tone="purple" />
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <DataCard title="Ranh giới phường" subtitle="GeoJSON Polygon EPSG:4326">
                    <div className="p-5">
                        <input ref={zoneFile} type="file" accept=".json,.geojson" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) importZones(f); e.target.value = ''; }} />
                        <Button type="button" variant="outline" onClick={() => zoneFile.current?.click()}>Nhập file mới</Button>
                    </div>
                </DataCard>
                <DataCard title="OSM / TomTom" subtitle={quota ? `${quota.used}/${quota.limit} lượt` : 'Đang đọc hạn mức'}>
                    <div className="p-5">
                        <Button type="button" variant="outline" onClick={() => api.post('/traffic/sample').then(() => setMessage('Đã lấy mẫu.')).catch(() => setMessage('Cần đăng nhập quản trị.'))}>Lấy mẫu giao thông</Button>
                    </div>
                </DataCard>
                <DataCard title="Hệ số phát thải" subtitle={`${factors.length} hệ số`}>
                    <div className="p-5">
                        <Link href="/logistics/emissions" className="text-sm font-semibold text-[#2f6bff]">Sửa danh mục</Link>
                    </div>
                </DataCard>
                <DataCard title="Khảo sát" subtitle="Phiếu nghiên cứu">
                    <div className="p-5">
                        <Link href="/nghien-cuu" className="text-sm font-semibold text-[#2f6bff]">Duyệt phiếu</Link>
                    </div>
                </DataCard>
            </div>

            <DataCard title="Công việc nền">
                <DataTable
                    data={jobs}
                    emptyMessage="Chưa có job. Lấy mẫu giao thông để tạo."
                    columns={[
                        { key: 'type', header: 'Job', render: (j) => `${j.type} #${j.id}` },
                        { key: 'status', header: 'Trạng thái', render: (j) => <SoftTag tone={j.status === 'completed' ? 'green' : 'navy'}>{j.status}</SoftTag> },
                        { key: 'createdAt', header: 'Bắt đầu', render: (j) => j.createdAt ? new Date(j.createdAt).toLocaleString('vi-VN') : '—' },
                    ] satisfies Column<Job>[]}
                />
                {(message || quota?.note) && <p className="px-5 pb-4 text-xs text-[#66728b]">{message || quota?.note}</p>}
            </DataCard>

            <DataCard title="Dịch vụ">
                <DataTable
                    pagination={false}
                    data={[
                        { id: 'api', name: 'api', ok: health === 'ok' },
                        { id: 'web', name: 'web', ok: true },
                        { id: 'mysql', name: 'mysql', ok: health === 'ok' },
                    ]}
                    columns={[
                        { key: 'name', header: 'Dịch vụ' },
                        { key: 'ok', header: 'Trạng thái', render: (s) => (
                            <span className="flex items-center gap-2">
                                <span className={`h-2 w-2 rounded-full ${s.ok ? 'bg-[#16a34a]' : 'bg-red-500'}`} />
                                {s.ok ? 'OK' : 'Down'}
                            </span>
                        ) },
                    ]}
                />
            </DataCard>
        </div>
    );
}
