import Link from 'next/link';

const roles = [
    { title: 'Khách', code: 'guest · không đăng nhập', text: 'Xem số liệu tổng hợp đã ẩn danh và kết quả nghiên cứu.', links: [['Website công khai', '/cong-khai']] },
    { title: 'Thành viên', code: 'member · shipper, sinh viên, CTV', text: 'Bản đồ, cảnh báo cấm đường theo loại xe, báo điểm nghẽn, nhận nhiệm vụ khảo sát.', links: [['Bản đồ (desktop)', '/thanh-vien/ban-do'], ['Mobile: cảnh báo & báo điểm nghẽn', '/mobile'], ['Mobile: nhiệm vụ khảo sát', '/mobile/nhiem-vu']] },
    { title: 'Doanh nghiệp', code: 'org_admin · org_staff', text: 'Quản trị DN quản lý hồ sơ, kho, đội xe, người dùng. Nhân viên lập và chạy tối ưu tuyến.', links: [['Tổng quan & báo cáo so sánh', '/doanh-nghiep'], ['Đội xe & kho', '/doanh-nghiep/doi-xe'], ['Tối ưu tuyến', '/doanh-nghiep/toi-uu']] },
    { title: 'Cơ quan quản lý', code: 'regulator', text: 'Giám sát điểm nghẽn và phát thải, đặt LEZ và cấm giờ, so sánh trước/sau khi đổi quy định.', links: [['Giám sát', '/co-quan'], ['Zone & quy định', '/co-quan/zone'], ['Mô phỏng chính sách', '/co-quan/mo-phong']] },
    { title: 'Nghiên cứu', code: 'researcher · chủ nhiệm, giảng viên', text: 'Giao nhiệm vụ khảo sát, duyệt phiếu, xuất dữ liệu cho SPSS/SmartPLS.', links: [['Khảo sát & duyệt phiếu', '/nghien-cuu'], ['Dữ liệu & xuất', '/nghien-cuu/xuat']] },
    { title: 'Quản trị hệ thống', code: 'sys_admin', text: 'Tài khoản, tổ chức, vai trò; nạp dữ liệu nền; theo dõi job và sức khoẻ hệ thống.', links: [['Người dùng & tổ chức', '/he-thong/nguoi-dung'], ['Dữ liệu nền & hệ thống', '/he-thong/du-lieu']] },
];

export default function HomePage() {
    return (
        <main className="min-h-screen bg-[#e7eee9] text-[#14211c]">
            <div className="mx-auto max-w-6xl px-8 py-14">
                <div className="flex items-start justify-between gap-6">
                    <div>
                        <p className="text-[13px] font-bold text-[#0e6e5c]">NỀN TẢNG LOGISTICS ĐÔ THỊ THÔNG MINH · ĐỀ TÀI B2025-GHA-05</p>
                        <h1 className="mt-3 text-[34px] font-bold">Sơ đồ màn hình theo vai trò</h1>
                        <p className="mt-3 max-w-3xl text-[15px] leading-6 text-[#56635d]">6 vai trò, 16 màn hình. Khảo sát không phải một vai trò: bất kỳ tài khoản nào được nhóm nghiên cứu giao nhiệm vụ đều thấy mục “Nhiệm vụ khảo sát”.</p>
                    </div>
                    <Link href="/login" className="mt-10 shrink-0 rounded-xl bg-[#0e6e5c] px-5 py-3 text-sm font-bold text-white">Mở màn đăng nhập</Link>
                </div>
                <div className="mt-8 grid gap-4 md:grid-cols-3">
                    {roles.map((role) => (
                        <article key={role.title} className="min-h-[210px] rounded-2xl border border-[#d7e2da] bg-[#f7faf8] p-5">
                            <div className="flex items-start justify-between gap-3">
                                <h2 className="text-lg font-bold">{role.title}</h2>
                                <span className="text-right text-xs text-[#56635d]">{role.code}</span>
                            </div>
                            <p className="mt-3 text-sm leading-6 text-[#56635d]">{role.text}</p>
                            <ul className="mt-4 space-y-1.5 text-sm">
                                {role.links.map(([label, href]) => <li key={href}><Link href={href} className="text-[#0e6e5c] underline">{label} →</Link></li>)}
                            </ul>
                        </article>
                    ))}
                </div>
                <div className="mt-4 grid gap-6 rounded-2xl bg-[#e3ebe4] p-5 text-sm md:grid-cols-3">
                    <p><strong>Nhiệm vụ khảo sát</strong> · Nghiên cứu giao cho bất kỳ tài khoản nào (phường, mẫu phiếu, số phiếu, hạn). Người nhận thấy mục này trong menu và trên app mobile.</p>
                    <p><strong>Doanh nghiệp</strong> · Một vai trò, hai cấp: Quản trị DN và Nhân viên. Dữ liệu chỉ thấy trong phạm vi tổ chức mình.</p>
                    <p><strong>Số liệu trên các màn</strong> · Lấy từ API sau khi seed. Đăng nhập rồi dùng nút Đăng xuất ở sidebar / header.</p>
                </div>
            </div>
        </main>
    );
}
