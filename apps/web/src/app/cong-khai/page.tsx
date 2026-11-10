'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Map from '@/components/shared/map';
import type { GeoJsonFeatureCollection } from '@/components/shared/map';

const wards = [
    ['Hoàn Kiếm', '48', '4,3', '22%', 'Trưa', '36'],
    ['Cửa Nam', '31', '4,0', '18%', 'Trưa', '24'],
    ['Ba Đình', '27', '3,4', '25%', 'Chiều', '19'],
    ['Cầu Giấy', '52', '3,1', '31%', 'Tối', '41'],
    ['Giảng Võ', '—', '—', '—', '—', '—'],
];

export default function PublicSitePage() {
    const [congestion, setCongestion] = useState<GeoJsonFeatureCollection | null>(null);
    const [layers, setLayers] = useState({ heat: true, points: true, zones: true });
    const [query, setQuery] = useState('');

    useEffect(() => {
        Promise.all([
            fetch('/api/v1/traffic/segments').then((r) => (r.ok ? r.json() : null)).catch(() => null),
            fetch('/api/v1/bottlenecks').then((r) => (r.ok ? r.json() : null)).catch(() => null),
        ]).then(([segments, bottlenecks]) => {
            const lines = Array.isArray(segments?.features) ? segments.features : [];
            const items = Array.isArray(bottlenecks?.items) ? bottlenecks.items : [];
            const points = items.map((item: { longitude: number; latitude: number; issueType?: string }) => ({
                type: 'Feature' as const,
                geometry: { type: 'Point' as const, coordinates: [item.longitude, item.latitude] },
                properties: {
                    weight: item.issueType === 'congestion' ? 1 : 0.65,
                    color: item.issueType === 'congestion' ? '#c2410c' : '#d97706',
                },
            }));
            setCongestion({ type: 'FeatureCollection', features: [...lines, ...points] });
        }).catch(() => undefined);
    }, []);

    return (
        <main className="min-h-screen bg-[#eef2ef] text-[#14211c]">
            <header className="bg-white">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
                    <Link href="/" className="flex items-center gap-2 font-semibold">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#14352c] text-xs text-white">↗</span>
                        Logistics Đô thị Hà Nội
                    </Link>
                    <nav className="flex items-center gap-5 text-sm text-[#3f4a45]">
                        <a href="#ban-do">Bản đồ</a>
                        <a href="#chi-so">Chỉ số phường</a>
                        <a href="#ket-qua">Nghiên cứu</a>
                        <a href="#du-lieu">Dữ liệu mở</a>
                        <Link href="/login" className="rounded-lg bg-[#0e6e5c] px-3 py-1.5 font-semibold text-white">Đăng nhập</Link>
                    </nav>
                </div>
            </header>

            <section className="mx-auto max-w-6xl px-6 pb-6 pt-8">
                <p className="text-[11px] font-bold tracking-wide text-[#0e6e5c]">ĐỀ TÀI CẤP BỘ B2025-GHA-05 · ĐH GIAO THÔNG VẬN TẢI</p>
                <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-tight">Giao hàng chặng cuối ở nội đô Hà Nội đang tắc ở đâu?</h1>
                <div className="mt-4 flex items-end justify-between gap-8">
                    <p className="max-w-xl text-sm leading-6 text-[#56635d]">Bản đồ và chỉ số tổng hợp từ khảo sát shipper, doanh nghiệp và dữ liệu mở. Mọi số liệu công khai đều đã ẩn danh.</p>
                    <div className="flex shrink-0 gap-2">
                        <a href="#ban-do" className="rounded-lg bg-[#0e6e5c] px-4 py-2.5 text-sm font-semibold text-white">Xem bản đồ</a>
                        <a href="#ket-qua" className="rounded-lg border border-[#d5e0da] bg-white px-4 py-2.5 text-sm">Kết quả nghiên cứu</a>
                    </div>
                </div>
            </section>

            <section id="ban-do" className="mx-auto max-w-6xl px-6">
                <div className="grid overflow-hidden rounded-2xl bg-white shadow-sm lg:grid-cols-[240px_1fr]">
                    <aside className="border-r border-[#edf1ee] p-4 text-sm">
                        <p className="font-semibold">Lớp bản đồ</p>
                        <ul className="mt-3 space-y-2 text-[#3f4a45]">
                            <li><label className="flex items-center gap-2"><input type="checkbox" checked={layers.heat} onChange={() => setLayers({ ...layers, heat: !layers.heat })} /> Mật độ điểm nghẽn</label></li>
                            <li><label className="flex items-center gap-2"><input type="checkbox" checked={layers.points} onChange={() => setLayers({ ...layers, points: !layers.points })} /> Điểm giao nhận & kho</label></li>
                            <li><label className="flex items-center gap-2"><input type="checkbox" checked readOnly /> Điểm đỗ đã xác minh</label></li>
                            <li><label className="flex items-center gap-2"><input type="checkbox" checked={layers.zones} onChange={() => setLayers({ ...layers, zones: !layers.zones })} /> Vùng hạn chế (LEZ, cấm giờ)</label></li>
                        </ul>
                        <form className="mt-4" onSubmit={(e) => { e.preventDefault(); fetch(`/api/v1/geocode?q=${encodeURIComponent(query)}`); }}>
                            <input className="w-full rounded-lg border px-2 py-1.5 text-xs" placeholder="Khung giờ" value={query} onChange={(e) => setQuery(e.target.value)} />
                        </form>
                        <p className="mt-4 text-xs font-medium">Mật độ phản ánh</p>
                        <div className="mt-1 h-1.5 rounded-full bg-gradient-to-r from-[#f6d7a8] to-[#c2410c]" />
                        <div className="mt-1 flex justify-between text-[10px] text-[#7b8781]"><span>Thấp</span><span>Cao</span></div>
                        <p className="mt-3 text-[11px] leading-4 text-[#7b8781]">Chỉ hiện khi mỗi ô có từ 5 phản ánh trở lên. Vị trí được làm mờ ±50 m.</p>
                    </aside>
                    <div className="h-[420px]">
                        <Map className="h-full w-full" center={[105.845, 21.027]} zoom={13.4} congestionGeoJson={layers.heat ? congestion : null} />
                    </div>
                </div>
            </section>

            <section id="chi-so" className="mx-auto max-w-6xl px-6 py-8">
                <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Chỉ số theo phường</h2>
                    <span className="rounded-full bg-[#f3e6cf] px-2.5 py-1 text-[11px] text-[#8a5a12]">Số liệu minh hoạ</span>
                </div>
                <div className="overflow-hidden rounded-2xl bg-white">
                    <table className="w-full text-sm">
                        <thead className="text-left text-[11px] tracking-wide text-[#7b8781]">
                            <tr><th className="px-4 py-3">PHƯỜNG</th><th>ĐIỂM GIAO NHẬN</th><th>MỨC KHÓ ĐỖ (1–5)</th><th>TỶ LỆ XE ĐIỆN</th><th>CAO ĐIỂM</th><th>SỐ PHIẾU</th></tr>
                        </thead>
                        <tbody>
                            {wards.map((row) => (
                                <tr key={row[0]} className="border-t border-[#eef2ef]">
                                    {row.map((cell, i) => <td key={i} className="px-4 py-3">{cell}</td>)}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <p className="px-4 py-2 text-right text-[11px] text-[#7b8781]">3 · chưa đủ 5 phiếu</p>
                </div>
            </section>

            <section id="ket-qua" className="mx-auto max-w-6xl px-6 pb-8">
                <h2 className="text-xl font-semibold">Kết quả nghiên cứu</h2>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                    <article className="rounded-2xl bg-white p-4 text-sm">
                        <p className="text-[11px] text-[#0e6e5c]">Bài báo · Tạp chí KH GTVT</p>
                        <h3 className="mt-2 font-semibold">Smart City Development in Asian Countries: Case Studies and Policy Implications</h3>
                        <p className="mt-2 text-[#56635d]">So sánh Singapore, Seoul, Jakarta và đánh giá Hà Nội. TP.HCM theo 6 trụ cột đô thị thông minh.</p>
                        <a className="mt-3 inline-block font-semibold text-[#0e6e5c]" href="#ket-qua">Đọc bài →</a>
                    </article>
                    <article className="rounded-2xl bg-white p-4 text-sm">
                        <p className="text-[11px] text-[#0e6e5c]">Mô hình · SmartPLS</p>
                        <h3 className="mt-2 font-semibold">Yếu tố logistics đô thị ảnh hưởng tới đô thị thông minh</h3>
                        <p className="mt-2 text-[#56635d]">[Tóm tắt kết quả mô hình khi hoàn thành phân tích]</p>
                        <Link className="mt-3 inline-block font-semibold text-[#0e6e5c]" href="/co-quan/mo-phong">Xem sơ đồ mô hình →</Link>
                    </article>
                    <article id="du-lieu" className="rounded-2xl bg-white p-4 text-sm">
                        <p className="text-[11px] text-[#0e6e5c]">Dữ liệu mở</p>
                        <h3 className="mt-2 font-semibold">Bộ dữ liệu khảo sát đã ẩn danh</h3>
                        <p className="mt-2 text-[#56635d]">CSV kèm codebook song ngữ. Bản đồ nền © OpenStreetMap (ODbL).</p>
                        <Link className="mt-3 inline-block font-semibold text-[#0e6e5c]" href="/nghien-cuu/xuat">Tải về →</Link>
                    </article>
                </div>
            </section>

            <section className="mx-auto max-w-6xl px-6 pb-10">
                <h2 className="text-xl font-semibold">Đối tác dữ liệu</h2>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                    {[
                        ['logo-a', '[Logo đối tác]'],
                        ['logo-b', '[Logo đối tác]'],
                        ['anon', 'Doanh nghiệp ẩn danh'],
                    ].map(([key, name]) => (
                        <span key={key} className="rounded-xl border border-[#d7e0da] bg-white px-4 py-3 text-sm text-[#7b8781]">{name}</span>
                    ))}
                    <Link href="/studio/doi-tac" className="rounded-xl border border-[#0e6e5c] px-4 py-3 text-sm font-semibold text-[#0e6e5c]">Trở thành đối tác →</Link>
                </div>
            </section>

            <footer className="bg-[#14352c] text-sm text-[#c5d5ce]">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                    <p>Nhóm nghiên cứu · Trường ĐH Giao thông vận tải · 3 Cầu Giấy, Hà Nội</p>
                    <p className="space-x-4 text-xs"><span>Quyền riêng tư</span><span>Nguồn dữ liệu</span><span>Liên hệ</span></p>
                </div>
            </footer>
        </main>
    );
}
