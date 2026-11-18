'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { api, zoneApi } from '@/api';
import { PageHead, StudioShell, regulatorNav } from '@/components/studio/shell';
import { DataCard } from '@/components/studio/page-ui';
import { DataTable, type Column } from '@/components/ui';
import { useAuthStore } from '@/stores/auth-store';
import type { Zone } from '@/types';
import { AlertTriangle, CheckCircle2, Clock, FileText, Users } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
    type IssueRow,
    issueStatusLabel,
    issueTypeLabel,
    isPendingStatus,
    relativeTimeVi,
} from './issue-labels';

function greeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Chào buổi sáng';
    if (h < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
}

function todayKey(d = new Date()) {
    return d.toISOString().slice(0, 10);
}

export default function RegulatorOverviewPage() {
    const { user } = useAuthStore();
    const firstName = user?.name?.split(' ').pop() || 'Quản lý';
    const [issues, setIssues] = useState<IssueRow[]>([]);
    const [zones, setZones] = useState<Zone[]>([]);
    const [range, setRange] = useState('7');

    useEffect(() => {
        api.get('/issues').then((r) => setIssues(r.data ?? [])).catch(() => setIssues([]));
        zoneApi.getAll({ limit: 100 }).then((r) => setZones(r.data.data ?? r.data)).catch(() => setZones([]));
    }, []);

    const today = todayKey();
    const pending = issues.filter((i) => isPendingStatus(i.status));
    const approved = issues.filter((i) => i.status === 'approved');
    const todayIssues = issues.filter((i) => i.createdAt?.slice(0, 10) === today);
    const reporters = new Set(issues.map((i) => i.reporterHash).filter(Boolean));
    const handleRate = issues.length ? Math.round((approved.length / issues.length) * 1000) / 10 : 0;
    const urgent = pending.filter((i) => i.issueType === 'parking' || i.issueType === 'restriction').length;

    const typeCounts = issues.reduce<Record<string, number>>((acc, i) => {
        const k = issueTypeLabel(i.issueType);
        acc[k] = (acc[k] ?? 0) + 1;
        return acc;
    }, {});
    const typeTotal = Object.values(typeCounts).reduce((s, n) => s + n, 0) || 1;

    const days = Number(range) || 7;
    const chartData = useMemo(() => {
        const points = Array.from({ length: days }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (days - 1 - i));
            const key = todayKey(d);
            const count = issues.filter((it) => it.createdAt?.slice(0, 10) === key).length;
            return {
                date: d.toLocaleDateString('vi-VN', { weekday: 'short' }).replace(' ', ''),
                count,
            };
        });
        return points;
    }, [issues, days]);
    const chartTotal = chartData.reduce((s, p) => s + p.count, 0);

    const hotZones = useMemo(() => {
        return zones
            .map((z) => ({ id: z.id, name: z.name, n: issues.filter((i) => i.zoneId === z.id).length }))
            .sort((a, b) => b.n - a.n)
            .slice(0, 5);
    }, [zones, issues]);
    const hotMax = Math.max(1, ...hotZones.map((z) => z.n));
    const hotRows = hotZones.map((z, i) => ({ id: z.id, name: z.name, n: z.n, rank: i + 1 }));

    const recent = issues.slice(0, 8);
    const typeRows = Object.entries(typeCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([name, count]) => ({
            id: name,
            name,
            count,
            pct: `${Math.round((count / typeTotal) * 100)}%`,
        }));

    return (
        <StudioShell group="CƠ QUAN QUẢN LÝ" role="Cơ quan quản lý" items={regulatorNav}>
            <PageHead
                title={`${greeting()}, ${firstName}`}
                description="Đây là tình hình giao thông đô thị được ghi nhận trong hôm nay."
                extra={
                    <div className="flex items-center gap-2.5 rounded-[11px] border border-[#e0e7f0] bg-white py-1.5 pl-2 pr-3.5">
                        <span className="grid size-8 place-items-center rounded-lg bg-[#edf3ff] text-[#2f6bff]">
                            <Clock size={16} />
                        </span>
                        <div>
                            <p className="text-[7px] font-bold tracking-[0.08em] text-[#8a96a8]">HÔM NAY</p>
                            <p className="text-[11px] font-bold text-[#2b3a54]">
                                {new Date().toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                        </div>
                    </div>
                }
            />

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
                {[
                    { title: 'Tổng báo cáo', value: issues.length.toLocaleString('vi-VN'), note: `${todayIssues.length} báo cáo mới hôm nay`, icon: <FileText size={18} />, tone: 'blue', tag: '↗', tagClass: 'cq-tag-green' },
                    { title: 'Chờ xác minh', value: pending.length, note: `${urgent} báo cáo khẩn cấp`, icon: <Clock size={18} />, tone: 'orange', tag: 'Cần xử lý', tagClass: 'cq-tag-orange' },
                    { title: 'Tỷ lệ xử lý', value: `${handleRate.toLocaleString('vi-VN')}%`, note: `${approved.length} đã duyệt`, icon: <CheckCircle2 size={18} />, tone: 'green', tag: '↗', tagClass: 'cq-tag-green' },
                    { title: 'Người dùng báo cáo', value: reporters.size.toLocaleString('vi-VN'), note: `${reporters.size} người đã gửi phiếu`, icon: <Users size={18} />, tone: 'pink', tag: '↗', tagClass: 'cq-tag-green' },
                ].map((card) => (
                    <article className="cq-stat" key={card.title}>
                        <div className="flex items-start justify-between">
                            <span className={`metric-icon ${card.tone}`}>{card.icon}</span>
                            <span className={card.tagClass}>{card.tag}</span>
                        </div>
                        <p className="mt-3.5 text-[13px] text-[#748298]">{card.title}</p>
                        <p className="mt-1 text-2xl font-extrabold tracking-tight text-[#11213e]">{card.value}</p>
                        <p className="mt-1.5 text-[11px] text-[#8995a7]">{card.note}</p>
                    </article>
                ))}
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-[1.6fr_1fr]">
                <DataCard
                    title="Xu hướng báo cáo"
                    subtitle="Số lượng báo cáo trong khoảng thời gian gần nhất"
                    toolbar={
                        <select className="h-8 rounded-lg border border-[#e0e6ef] bg-white px-2 text-xs text-[#607087]" value={range} onChange={(e) => setRange(e.target.value)}>
                            <option value="7">7 ngày qua</option>
                            <option value="14">14 ngày qua</option>
                            <option value="30">30 ngày qua</option>
                        </select>
                    }
                >
                    <div className="flex items-baseline gap-2 px-5 pt-3">
                        <span className="text-xl font-extrabold text-[#13223e]">{chartTotal}</span>
                        <span className="text-[11px] text-[#8793a6]">Tổng báo cáo</span>
                    </div>
                    <div className="h-[220px] px-2 pb-3">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="4 4" stroke="#e8edf3" vertical={false} />
                                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9aa5b5' }} axisLine={false} tickLine={false} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9aa5b5' }} axisLine={false} tickLine={false} width={28} />
                                <Tooltip />
                                <Line type="monotone" dataKey="count" name="Báo cáo" stroke="#2e6cf5" strokeWidth={2.4} dot={{ r: 4, fill: '#fff', stroke: '#2e6cf5', strokeWidth: 2 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </DataCard>
                <DataCard title="Phân loại báo cáo" subtitle="Tỷ lệ theo loại sự cố">
                    <div className="px-5 py-6 text-center">
                        <p className="text-[40px] font-extrabold leading-none text-[#11213e]">{todayIssues.length || issues.length}</p>
                        <p className="mt-1 text-xs text-[#8995a7]">Hôm nay</p>
                    </div>
                    <DataTable
                        pagination={false}
                        emptyMessage="Chưa có phân loại"
                        data={typeRows}
                        columns={[
                            { key: 'name', header: 'Loại' },
                            { key: 'count', header: 'Số', className: 'text-right' },
                            { key: 'pct', header: 'Tỷ lệ', className: 'text-right' },
                        ]}
                    />
                </DataCard>
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-[1.6fr_1fr]">
                <DataCard
                    title="Báo cáo mới nhất"
                    subtitle="Các báo cáo vừa được gửi lên hệ thống"
                    toolbar={<Link href="/co-quan/bao-cao" className="text-sm font-semibold text-[#2f6bff]">Xem tất cả →</Link>}
                >
                    <DataTable
                        data={recent}
                        emptyMessage="Chưa có báo cáo"
                        columns={[
                            { key: 'note', header: 'Báo cáo', render: (r) => (
                                <div>
                                    <p className="font-semibold text-[#11213e]">{r.note || issueTypeLabel(r.issueType)}</p>
                                    <p className="text-[11px] text-[#8995a7]">BC-{r.id} · {issueTypeLabel(r.issueType)}</p>
                                </div>
                            ) },
                            { key: 'createdAt', header: 'Thời gian', render: (r) => relativeTimeVi(r.createdAt) },
                            { key: 'status', header: 'Trạng thái', render: (r) => (
                                <span className={r.status === 'approved' ? 'cq-pill green' : r.status === 'rejected' ? 'cq-pill red' : 'cq-pill orange'}>
                                    {issueStatusLabel(r.status)}
                                </span>
                            ) },
                        ] satisfies Column<IssueRow>[]}
                    />
                </DataCard>
                <DataCard title="Khu vực nổi bật" subtitle="Báo cáo theo khu vực hôm nay">
                    <DataTable
                        pagination={false}
                        emptyMessage="Chưa có dữ liệu vùng"
                        data={hotRows}
                        columns={[
                            { key: 'rank', header: '#' },
                            { key: 'name', header: 'Khu vực' },
                            { key: 'n', header: 'Mức', render: (z) => (
                                <div className="h-1.5 w-24 overflow-hidden rounded-full bg-[#edf1f6]">
                                    <div className="h-1.5 rounded-full bg-[#2e6cf5]" style={{ width: `${Math.round((z.n / hotMax) * 100)}%` }} />
                                </div>
                            ) },
                            { key: 'count', header: 'Số', className: 'text-right', render: (z) => z.n },
                        ]}
                    />
                    {hotZones.length === 0 && (
                        <p className="flex items-center gap-2 px-4 pb-4 text-xs text-[#8995a7]">
                            <AlertTriangle size={14} /> Chưa gắn vùng cho báo cáo
                        </p>
                    )}
                </DataCard>
            </div>
        </StudioShell>
    );
}
