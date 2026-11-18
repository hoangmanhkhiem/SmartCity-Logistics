'use client';

import Link from 'next/link';
import ReportIncident from '@/components/shared/report-incident';

export default function CommunityReportPage() {
    return (
        <main className="min-h-screen bg-[#e7eee9] text-[#14211c]">
            <header className="border-b border-[#d7e2db] bg-white">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
                    <Link href="/" className="font-semibold">Logistics Đô thị Hà Nội</Link>
                    <nav className="flex gap-4 text-sm">
                        <Link href="/cong-khai">Bản đồ công khai</Link>
                        <Link href="/nghien-cuu/bao-cao" className="font-semibold text-[#0e6e5c]">Báo cáo giao thông</Link>
                    </nav>
                </div>
            </header>
            <div className="mx-auto max-w-6xl space-y-4 px-6 py-6">
                <div>
                    <p className="text-[11px] font-bold tracking-wide text-[#0e6e5c]">CỘNG ĐỒNG</p>
                    <h1 className="text-2xl font-bold">Báo cáo ùn tắc & sự cố</h1>
                    <p className="mt-1 max-w-2xl text-sm text-[#56635d]">Mọi tài khoản đều gửi được. Sau khi cơ quan duyệt, điểm đỏ hiện trên bản đồ và được dùng khi tìm đường, cùng với tuyến cấm và zone.</p>
                </div>
                <ReportIncident />
            </div>
        </main>
    );
}
