'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Clock, Database } from 'lucide-react';
import { api } from '@/api';
import { DataCard } from '@/components/studio/page-ui';
import { PageHead, StudioShell, researchNav } from '@/components/studio/shell';
import { DataTable, type Column } from '@/components/ui';

const datasets = [
    { id: 'shipper', name: 'Phiếu shipper', rows: 120, pending: 4, source: 'PWA + Google Form', updated: 'Hôm nay' },
    { id: 'org', name: 'Phiếu doanh nghiệp (4 mẫu)', rows: 11, pending: 0, source: 'Google Form', updated: 'Hôm nay' },
    { id: 'field', name: 'Ghi nhận hiện trường P1–P9', rows: 96, pending: 1, source: 'PWA', updated: 'Hôm nay' },
    { id: 'issues', name: 'Phản ánh điểm nghẽn', rows: 412, pending: 23, source: 'PWA', updated: 'Liên tục' },
];
const codebook = [
    { id: 'PARK_DIFF', code: 'PARK_DIFF', q: '3.2', label: 'Tiêu chí độ khó đỗ' },
    { id: 'PARK_IMP', code: 'PARK_IMP', q: '3.3', label: 'Thiếu chỗ đỗ ảnh hưởng tuyến' },
    { id: 'ISSUE_JAM', code: 'ISSUE_JAM', q: '3.4', label: 'Ùn tắc' },
    { id: 'PEAK_IMP', code: 'PEAK_IMP', q: '4.3', label: 'Cao điểm ảnh hưởng giao' },
    { id: 'ROUTE_SAVE', code: 'ROUTE_SAVE', q: '5.1', label: 'Đề xuất đổi tuyến' },
];

export default function ExportPage() {
    const [format, setFormat] = useState<'sav' | 'csv' | 'xlsx'>('sav');
    const [opts, setOpts] = useState({ dummy: true, codebook: true, hideSite: true });
    const [live, setLive] = useState({ surveys: 0, pending: 0, issues: 0 });

    useEffect(() => {
        Promise.all([
            api.get('/surveys/responses').then((r) => r.data ?? []).catch(() => []),
            api.get('/issues').then((r) => r.data ?? []).catch(() => []),
        ]).then(([surveys, issues]: [Array<{ status?: string }>, unknown[]]) => {
            const pending = surveys.filter((s) => s.status !== 'approved' && s.status !== 'rejected').length;
            setLive({ surveys: surveys.length, pending, issues: Array.isArray(issues) ? issues.length : 0 });
        });
    }, []);

    const totalRows = datasets.reduce((s, d) => s + d.rows, 0);
    const pendingRows = datasets.reduce((s, d) => s + d.pending, 0);
    const displayTotal = live.surveys + live.issues || totalRows;
    const displayPending = live.pending || pendingRows;
    const shipperCount = datasets[0].rows;

    const download = () => api.get('/phases/surveys/shipper/export').then((r) => {
        const csv = typeof r.data === 'string' ? r.data : (r.data?.csv ?? JSON.stringify(r.data));
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        const ext = format === 'xlsx' ? 'xlsx' : format === 'sav' ? 'sav.csv' : 'csv';
        a.download = `shipper.${ext}`;
        a.click();
    }).catch(() => undefined);

    const formatLabel = format === 'sav' ? 'SPSS (.sav)' : format === 'xlsx' ? 'Excel (.xlsx)' : 'CSV cho SmartPLS';

    return (
        <StudioShell group="NGHIÊN CỨU" role="Nghiên cứu viên" items={researchNav}>
            <PageHead
                title="Dữ liệu & xuất phân tích"
                crumb="Dữ liệu & xuất phân tích"
                eyebrow="NGHIÊN CỨU & VẬN HÀNH"
                description="Quản lý bộ dữ liệu nghiên cứu và chuẩn hoá đầu ra cho các công cụ phân tích."
            />

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
                {[
                    { title: 'Tổng bản ghi', value: displayTotal.toLocaleString('vi-VN'), note: '4 bộ dữ liệu', icon: <Database size={18} />, tone: 'blue' },
                    { title: 'Chờ duyệt', value: displayPending, note: 'Cần kiểm tra', icon: <Clock size={18} />, tone: 'orange' },
                    { title: 'Cập nhật hôm nay', value: live.surveys || 31, note: 'Lúc 10:42', icon: <CheckCircle2 size={18} />, tone: 'green' },
                ].map((card) => (
                    <article className="cq-kpi" key={card.title}>
                        <span className={`metric-icon ${card.tone}`}>{card.icon}</span>
                        <div>
                            <p className="text-[13px] text-[#748298]">{card.title}</p>
                            <p className="mt-0.5 text-[28px] font-extrabold tracking-tight text-[#11213e]">{card.value}</p>
                            <p className="mt-1 text-[11px] text-[#8a97a9]">{card.note}</p>
                        </div>
                    </article>
                ))}
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                <DataCard title="Bộ dữ liệu" subtitle="Các nguồn dữ liệu đang được đồng bộ">
                    <DataTable
                        pagination={false}
                        data={datasets}
                        columns={[
                            { key: 'name', header: 'Bộ dữ liệu', render: (r) => <span className="font-semibold text-[#152542]">{r.name}</span> },
                            { key: 'rows', header: 'Dòng' },
                            { key: 'pending', header: 'Chờ duyệt' },
                            { key: 'source', header: 'Nguồn' },
                            { key: 'updated', header: 'Cập nhật' },
                        ] satisfies Column<(typeof datasets)[number]>[]}
                    />
                    <div className="m-4 rounded-[14px] border border-[#e6ebf2] bg-[#f7f9fc] p-4">
                        <h3 className="text-[15px] font-bold text-[#152542]">Xuất cho SPSS / SmartPLS</h3>
                        <p className="mt-0.5 text-[12px] text-[#748298]">Chọn định dạng và tuỳ chọn dữ liệu đầu ra</p>
                        <div className="mt-3 grid gap-4 sm:grid-cols-2 text-[13px] text-[#33425c]">
                            <div>
                                <p className="text-[12px] font-semibold">Định dạng</p>
                                {([
                                    ['sav', 'SPSS (.sav)'],
                                    ['csv', 'CSV cho SmartPLS'],
                                    ['xlsx', 'Excel (.xlsx)'],
                                ] as const).map(([id, label]) => (
                                    <label key={id} className="mt-1.5 flex items-center gap-2">
                                        <input type="radio" name="out" checked={format === id} onChange={() => setFormat(id)} />
                                        {label}
                                    </label>
                                ))}
                            </div>
                            <div>
                                <p className="text-[12px] font-semibold">Tuỳ chọn</p>
                                <label className="mt-1.5 flex items-center gap-2">
                                    <input type="checkbox" checked={opts.dummy} onChange={() => setOpts({ ...opts, dummy: !opts.dummy })} />
                                    Tách câu chọn nhiều thành biến 0/1
                                </label>
                                <label className="mt-1.5 flex items-center gap-2">
                                    <input type="checkbox" checked={opts.codebook} onChange={() => setOpts({ ...opts, codebook: !opts.codebook })} />
                                    Kèm codebook song ngữ
                                </label>
                                <label className="mt-1.5 flex items-center gap-2">
                                    <input type="checkbox" checked={opts.hideSite} onChange={() => setOpts({ ...opts, hideSite: !opts.hideSite })} />
                                    Ẩn mã điểm khảo sát
                                </label>
                            </div>
                        </div>
                        <button className="nc-cta mt-4 max-w-xs" type="button" onClick={download}>
                            Xuất {shipperCount} phiếu · {formatLabel}
                        </button>
                    </div>
                </DataCard>

                <DataCard title="Xem trước codebook" subtitle="Quy ước biến cho bộ Phiếu shipper">
                    <DataTable
                        pagination={false}
                        data={codebook}
                        columns={[
                            { key: 'code', header: 'Mã', render: (r) => <span className="font-semibold text-[#2f6bff]">{r.code}</span> },
                            { key: 'q', header: 'Câu' },
                            { key: 'label', header: 'Nhãn' },
                        ] satisfies Column<(typeof codebook)[number]>[]}
                    />
                </DataCard>
            </div>
        </StudioShell>
    );
}
