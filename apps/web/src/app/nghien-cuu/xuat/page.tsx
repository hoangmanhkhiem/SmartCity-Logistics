'use client';

import { api } from '@/api';
import { PageHead, StudioShell, researchNav } from '@/components/studio/shell';

const datasets = [
    ['Phiếu shipper', '120', '4', 'PWA + Google Form', 'Hôm nay'],
    ['Phiếu doanh nghiệp (4 mẫu)', '11', '0', 'Google Form', 'Hôm nay'],
    ['Ghi nhận hiện trường P1–P9', '96', '1', 'PWA', 'Hôm nay'],
    ['Phản ánh điểm nghẽn', '412', '23', 'PWA', 'Liên tục'],
];
const codebook = [
    ['PARK_DIFF', '3.2', 'Tiêu chí độ khó đỗ', 'Likert 1–5'],
    ['PARK_IMP', '3.3', 'Thiếu chỗ đỗ ảnh hưởng tuyến', 'Likert 1–5'],
    ['ISSUE_JAM', '3.4', 'Ùn tắc', 'Competing'],
    ['PEAK_IMP', '4.3', 'Cao điểm ảnh hưởng giao', 'Likert 1–5'],
    ['ROUTE_SAVE', '5.1', 'Đề xuất đổi tuyến', 'Route suggestion save time'],
];

export default function ExportPage() {
    const download = () => api.get('/phases/surveys/shipper/export').then((r) => {
        const csv = typeof r.data === 'string' ? r.data : (r.data?.csv ?? JSON.stringify(r.data));
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'shipper.csv';
        a.click();
    }).catch(() => undefined);
    return (
        <StudioShell group="NGHIÊN CỨU" role="Nghiên cứu viên" items={researchNav}>
            <PageHead title="Dữ liệu & xuất phân tích" />
            <div className="grid gap-4 px-6 pb-6 lg:grid-cols-[1.1fr_0.9fr]">
                <section className="rounded-2xl bg-white p-4 text-sm">
                    <table className="w-full">
                        <thead className="text-left text-xs text-[#7b8781]"><tr><th className="py-2">Bộ dữ liệu</th><th>Dòng</th><th>Chờ duyệt</th><th>Nguồn</th><th>Cập nhật</th></tr></thead>
                        <tbody>{datasets.map((r) => <tr key={r[0]} className="border-t">{r.map((c) => <td key={c} className="py-2">{c}</td>)}</tr>)}</tbody>
                    </table>
                    <h2 className="mt-4 font-semibold">Xuất cho SPSS / SmartPLS</h2>
                    <div className="mt-2 grid gap-3 md:grid-cols-2 text-[#56635d]">
                        <div><p className="text-xs">Đích</p><label className="mt-1 flex gap-2"><input type="radio" name="out" defaultChecked /> SPSS (.sav)</label><label className="flex gap-2"><input type="radio" name="out" /> CSV cho SmartPLS</label><label className="flex gap-2"><input type="radio" name="out" /> Excel (.xlsx)</label></div>
                        <div><p className="text-xs">Tuỳ chọn</p><label className="mt-1 flex gap-2"><input type="checkbox" defaultChecked /> Tách câu chọn nhiều thành biến 0/1</label><label className="flex gap-2"><input type="checkbox" defaultChecked /> Kèm codebook song ngữ</label><label className="flex gap-2"><input type="checkbox" defaultChecked /> Ẩn mã điểm khảo sát</label></div>
                    </div>
                    <button className="mt-4 rounded-xl bg-[#0e6e5c] px-4 py-2.5 font-semibold text-white" type="button" onClick={download}>Xuất 120 phiếu</button>
                </section>
                <section className="rounded-2xl bg-white p-4 text-sm">
                    <h2 className="font-semibold">Xem trước codebook</h2>
                    <table className="mt-2 w-full text-xs">
                        <thead className="text-left text-[#7b8781]"><tr><th className="py-2">Mã</th><th>Câu</th><th>Nhãn</th><th>Thang</th></tr></thead>
                        <tbody>{codebook.map((r) => <tr key={r[0]} className="border-t">{r.map((c) => <td key={c} className="py-2">{c}</td>)}</tr>)}</tbody>
                    </table>
                </section>
            </div>
        </StudioShell>
    );
}
