'use client';

import Link from 'next/link';
import { Be_Vietnam_Pro } from 'next/font/google';
import Map from '@/components/shared/map';
import { MapSketch } from '@/components/landing/map-sketch';

const beVietnam = Be_Vietnam_Pro({
    subsets: ['latin', 'vietnamese'],
    weight: ['400', '500', '600', '700', '800'],
});

const nav = [
    ['Tính năng', '#tinh-nang'],
    ['Dành cho ai', '#doi-tuong'],
    ['Cách hoạt động', '#cach-hoat-dong'],
    ['Đối tác', '#doi-tac'],
];

export default function HomePage() {
    return (
        <div className={`${beVietnam.className} bg-[#f5f6f3] text-[#14211c]`}>
            <header className="relative min-h-[704px] overflow-hidden bg-[#10241e] text-white">
                <div className="absolute inset-0 opacity-[0.28]">
                    <Map className="h-full min-h-[760px] w-full" center={[105.845, 21.028]} zoom={13.2} showZonesAndRestrictions />
                </div>
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(16,36,30,0.96)_0%,rgba(16,36,30,0.82)_50%,rgba(16,36,30,0.45)_100%)]" />

                <nav className="relative z-10 mx-auto flex max-w-[1240px] items-center justify-between px-6 py-5 lg:px-8">
                    <Link href="/" className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0e6e5c]">
                            <svg width="20" height="20" viewBox="0 0 28 28" fill="none" aria-hidden>
                                <path d="M7 19 L12 9 L16 15 L21 8" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </span>
                        <span className="leading-tight">
                            <span className="block text-base font-bold">Logistics Đô thị</span>
                            <span className="block text-[11px] font-normal text-[#9fb3aa]">ĐH Giao thông vận tải</span>
                        </span>
                    </Link>
                    <div className="hidden items-center gap-6 text-sm font-medium text-[#cfdde6] md:flex">
                        {nav.map(([label, href]) => (
                            <a key={href} href={href} className="hover:text-white">{label}</a>
                        ))}
                        <Link href="/cong-khai" className="hover:text-white">Tra cứu</Link>
                        <Link href="/login" className="rounded-lg border border-[#4fc3a1] px-[19px] py-2.5 font-semibold text-white">Đăng nhập</Link>
                    </div>
                    <div className="flex gap-2 md:hidden">
                        <Link href="/cong-khai" className="text-sm text-[#cfdde6]">Tra cứu</Link>
                        <Link href="/login" className="rounded-lg border border-[#4fc3a1] px-3 py-1.5 text-sm font-semibold">Đăng nhập</Link>
                    </div>
                </nav>

                <div className="relative z-10 mx-auto max-w-[1240px] px-6 pb-16 pt-10 lg:px-8 lg:pt-16">
                    <p className="inline-flex rounded-full border border-[#2d4a40] px-3 py-1.5 text-[13px] font-semibold tracking-[0.06em] text-[#9fdcc8]">
                        ĐỀ TÀI CẤP BỘ B2025-GHA-05
                    </p>
                    <h1 className="mt-6 max-w-[780px] text-[40px] font-extrabold leading-[1.12] tracking-[-0.01em] sm:text-[54px]">
                        Một bản đồ chung cho giao hàng chặng cuối ở Hà Nội
                    </h1>
                    <p className="mt-5 max-w-[640px] text-[19px] leading-[1.6] text-[#cfdde6]">
                        Nền tảng giúp cơ quan quản lý, doanh nghiệp và nhà nghiên cứu cùng nhìn một bộ dữ liệu: vùng hạn chế, giờ cấm, loại xe, điểm nghẽn ngoài hiện trường, và tác động của từng chính sách trước khi áp dụng.
                    </p>
                    <div className="mt-8 flex flex-wrap gap-3">
                        <Link href="/cong-khai" className="inline-flex h-[58px] items-center gap-2.5 rounded-[10px] bg-[#4fc3a1] px-7 text-base font-bold text-[#0a2a22]">
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
                                <circle cx="8" cy="8" r="5.5" stroke="#0a2a22" strokeWidth="2" />
                                <path d="M12.5 12.5 L16 16" stroke="#0a2a22" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                            Tra cứu công khai
                        </Link>
                        <Link href="/login" className="inline-flex h-[58px] items-center gap-2 rounded-[10px] border border-[#cfdde6] px-7 text-base font-semibold text-white">
                            Đăng nhập hệ thống
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                                <path d="M3 8 H13 M9 4 L13 8 L9 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </Link>
                    </div>
                    <p className="mt-5 max-w-[720px] text-[13px] text-[#9fb3aa]">
                        Tra cứu không cần tài khoản · Đăng nhập dành cho cơ quan quản lý, doanh nghiệp, nhóm nghiên cứu và thành viên
                    </p>
                </div>
            </header>

            <section className="border-b border-[#dde1da] bg-white">
                <div className="mx-auto grid max-w-[1240px] gap-10 px-6 py-12 md:grid-cols-3 lg:px-8">
                    <div>
                        <p className="text-[13px] font-bold tracking-[0.05em] text-[#b85c00]">VẤN ĐỀ</p>
                        <h2 className="mt-2 text-xl font-bold">Mỗi bên giữ một mảnh dữ liệu</h2>
                        <p className="mt-3 text-[15px] leading-6 text-[#56635d]">Doanh nghiệp, ứng dụng giao hàng và cơ quan quản lý đều có dữ liệu riêng, không ai thấy bức tranh chung của giao hàng nội đô.</p>
                    </div>
                    <div>
                        <p className="text-[13px] font-bold tracking-[0.05em] text-[#b85c00]">HỆ QUẢ</p>
                        <h2 className="mt-2 text-xl font-bold">Quy định khó đo được tác động</h2>
                        <p className="mt-3 text-[15px] leading-6 text-[#56635d]">Cấm giờ, vùng hạn chế khí thải được ban hành nhưng khó biết trước sẽ làm quãng đường, khí thải và thời gian giao thay đổi ra sao.</p>
                    </div>
                    <div>
                        <p className="text-[13px] font-bold tracking-[0.05em] text-[#0e6e5c]">HƯỚNG GIẢI QUYẾT</p>
                        <h2 className="mt-2 text-xl font-bold">Đặt dữ liệu và nền tảng làm trung tâm</h2>
                        <p className="mt-3 text-[15px] leading-6 text-[#56635d]">Gom quy định, phản ánh hiện trường và số liệu vận hành về một nơi, dùng chung cho quản lý, vận hành và nghiên cứu.</p>
                    </div>
                </div>
            </section>

            <section id="tinh-nang" className="mx-auto max-w-[1240px] px-6 py-20 lg:px-8">
                <p className="text-[13px] font-bold tracking-[0.06em] text-[#0e6e5c]">TÍNH NĂNG</p>
                <h2 className="mt-3 max-w-2xl text-4xl font-bold leading-tight">Từ quy định trên bản đồ đến so sánh chính sách</h2>
                <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                    <article className="overflow-hidden rounded-[14px] border border-[#dde1da] bg-white">
                        <div className="h-[170px] overflow-hidden bg-[#e8ece4]"><MapSketch overlay="lez" /></div>
                        <div className="p-5">
                            <h3 className="text-lg font-bold">Vùng &amp; quy định</h3>
                            <p className="mt-2 text-sm leading-[1.6] text-[#56635d]">Vẽ vùng, chọn đoạn phố hoặc phường; gắn loại xe, khung giờ, mức cấm và căn cứ pháp lý. Một quy định dùng chung cho mọi phân hệ.</p>
                        </div>
                    </article>
                    <article className="overflow-hidden rounded-[14px] border border-[#dde1da] bg-white">
                        <div className="flex h-[170px] items-center justify-center gap-3 bg-[#e3f1ec] px-4">
                            <div className="w-[116px] rounded-[10px] bg-white p-3">
                                <p className="text-xs font-bold text-[#56635d]">A · Hiện trạng</p>
                                <div className="mt-2 h-2 w-[80%] rounded bg-[#c9cfc6]" />
                                <div className="mt-1.5 h-2 w-[62%] rounded bg-[#c9cfc6]" />
                                <div className="mt-1.5 h-2 w-[70%] rounded bg-[#c9cfc6]" />
                            </div>
                            <div className="w-[120px] rounded-[10px] border-2 border-[#0e6e5c] bg-white p-3">
                                <p className="text-xs font-bold text-[#0a4f42]">B · Kịch bản</p>
                                <div className="mt-2 h-2 w-[53%] rounded bg-[#0e6e5c]" />
                                <div className="mt-1.5 h-2 w-[75%] rounded bg-[#b85c00]" />
                                <div className="mt-1.5 h-2 w-[44%] rounded bg-[#0e6e5c]" />
                            </div>
                        </div>
                        <div className="p-5">
                            <h3 className="text-lg font-bold">Mô phỏng chính sách</h3>
                            <p className="mt-2 text-sm leading-[1.6] text-[#56635d]">So sánh hiện trạng với kịch bản: cấm xe xăng trong vùng hạn chế, dời giờ cấm, tăng xe điện. Xem quãng đường, CO₂e, tỷ lệ đúng giờ thay đổi thế nào.</p>
                        </div>
                    </article>
                    <article className="overflow-hidden rounded-[14px] border border-[#dde1da] bg-white">
                        <div className="h-[170px] overflow-hidden bg-[#e8ece4]"><MapSketch overlay="heat" /></div>
                        <div className="p-5">
                            <h3 className="text-lg font-bold">Phản ánh hiện trường</h3>
                            <p className="mt-2 text-sm leading-[1.6] text-[#56635d]">Mật độ tắc nghẽn, thiếu chỗ dừng đỗ, ngõ hẹp do shipper và khảo sát ghi nhận, đặt cạnh quy định để thấy chỗ nào cần rà soát.</p>
                        </div>
                    </article>
                    <article className="overflow-hidden rounded-[14px] border border-[#dde1da] bg-white">
                        <div className="h-[170px] overflow-hidden bg-[#e8ece4]"><MapSketch overlay="route" /></div>
                        <div className="p-5">
                            <h3 className="text-lg font-bold">Lập tuyến theo quy định</h3>
                            <p className="mt-2 text-sm leading-[1.6] text-[#56635d]">Doanh nghiệp lập tuyến trên đúng bộ quy định đang áp dụng, được cảnh báo khi tuyến đi vào vùng cấm giờ hoặc khu hạn chế khí thải.</p>
                        </div>
                    </article>
                </div>
            </section>

            <section id="doi-tuong" className="border-y border-[#dde1da] bg-white">
                <div className="mx-auto max-w-[1240px] px-6 py-20 lg:px-8">
                    <p className="text-[13px] font-bold tracking-[0.06em] text-[#0e6e5c]">DÀNH CHO AI</p>
                    <h2 className="mt-3 text-4xl font-bold">Mỗi vai trò một không gian làm việc</h2>
                    <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {[
                            ['Cơ quan quản lý', 'Ban hành, sửa quy định trên bản đồ; giám sát điểm nghẽn; thử chính sách trước khi áp dụng.'],
                            ['Doanh nghiệp giao hàng', 'Quản lý đội xe, lập tuyến tránh vùng cấm, so sánh chỉ số với trung bình ngành ở dạng ẩn danh.'],
                            ['Nhóm nghiên cứu', 'Giao nhiệm vụ khảo sát, duyệt phiếu, xuất dữ liệu cho phân tích thống kê.'],
                            ['Shipper & người dân', 'Xem cảnh báo cấm đường theo loại xe, báo điểm nghẽn bằng một chạm, tra cứu bản đồ công khai.'],
                        ].map(([title, text]) => (
                            <div key={title} className="rounded-xl border border-[#dde1da] p-5">
                                <h3 className="text-[17px] font-bold">{title}</h3>
                                <p className="mt-2 text-sm leading-[1.55] text-[#56635d]">{text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section id="cach-hoat-dong" className="mx-auto max-w-[1240px] px-6 py-20 lg:px-8">
                <p className="text-[13px] font-bold tracking-[0.06em] text-[#0e6e5c]">CÁCH HOẠT ĐỘNG</p>
                <h2 className="mt-3 max-w-3xl text-4xl font-bold leading-tight">Dữ liệu đi một chiều, có nhãn nguồn rõ ràng</h2>
                <ol className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {[
                        ['1', 'Thu thập', 'Khảo sát shipper và doanh nghiệp, văn bản quy định, bản đồ mở OpenStreetMap.'],
                        ['2', 'Chuẩn hoá & duyệt', 'Kiểm tra toạ độ, loại trùng, nhóm nghiên cứu duyệt trước khi dùng.'],
                        ['3', 'Bản đồ & mô phỏng', 'Đặt quy định, phản ánh và tuyến giao lên cùng bản đồ; chạy so sánh chính sách.'],
                        ['4', 'Khai thác', 'Tra cứu công khai, báo cáo cho doanh nghiệp, số liệu cho nghiên cứu và kiến nghị chính sách.'],
                    ].map(([n, title, text]) => (
                        <li key={n} className="rounded-xl border border-[#dde1da] bg-white p-5">
                            <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#0e6e5c] text-base font-bold text-white">{n}</span>
                            <h3 className="mt-4 text-[17px] font-bold">{title}</h3>
                            <p className="mt-2 text-sm leading-[1.55] text-[#56635d]">{text}</p>
                        </li>
                    ))}
                </ol>
                <p className="mt-8 text-sm text-[#56635d]">Số liệu công khai đều đã ẩn danh: không thu tên hay số điện thoại shipper, vị trí được làm mờ ±50 m, chỉ hiển thị khi có từ 5 phiếu.</p>
            </section>

            <section id="doi-tac" className="mx-auto max-w-[1240px] px-6 pb-20 lg:px-8">
                <div className="flex flex-col gap-8 rounded-[20px] bg-[#10241e] px-8 py-12 text-white lg:flex-row lg:items-center lg:justify-between lg:px-12">
                    <div className="max-w-xl">
                        <h2 className="text-[30px] font-bold">Bắt đầu từ bản đồ công khai</h2>
                        <p className="mt-3 text-base leading-6 text-[#cfdde6]">Xem vùng hạn chế, giờ cấm và mật độ phản ánh ở các phường nội đô. Doanh nghiệp muốn đồng hành cùng đề tài có thể đăng ký làm đối tác dữ liệu.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <Link href="/cong-khai" className="inline-flex h-[54px] items-center rounded-[10px] bg-[#4fc3a1] px-6 text-base font-bold text-[#0a2a22]">Tra cứu công khai</Link>
                        <Link href="/login" className="inline-flex h-[54px] items-center rounded-[10px] border border-[#cfdde6] px-6 text-base font-semibold">Đăng nhập</Link>
                        <Link href="/studio/doi-tac" className="text-base font-semibold text-[#9fdcc8] underline">Trở thành đối tác</Link>
                    </div>
                </div>
            </section>

            <footer className="border-t border-[#dde1da] bg-white">
                <div className="mx-auto flex max-w-[1240px] flex-col gap-8 px-6 py-10 lg:flex-row lg:items-end lg:justify-between lg:px-8">
                    <div className="text-sm">
                        <p className="font-bold">Nhóm nghiên cứu đề tài B2025-GHA-05</p>
                        <p className="mt-1 text-[#3f4a45]">Trường Đại học Giao thông vận tải · 3 Cầu Giấy, Hà Nội</p>
                        <p className="mt-1 text-[#3f4a45]">Chủ nhiệm đề tài: TS. Nguyễn Thị Vân Hà</p>
                    </div>
                    <div className="flex flex-col gap-1 text-sm text-[#0e6e5c]">
                        <Link href="/cong-khai" className="underline">Tra cứu công khai</Link>
                        <Link href="/login" className="underline">Đăng nhập</Link>
                        <span className="text-[#0e6e5c] underline">Quyền riêng tư</span>
                        <span>Liên hệ: [email đề tài]</span>
                    </div>
                    <p className="text-xs text-[#56635d]">Bản đồ nền © OpenStreetMap contributors · Dữ liệu minh hoạ cho mục đích nghiên cứu</p>
                </div>
            </footer>
        </div>
    );
}
