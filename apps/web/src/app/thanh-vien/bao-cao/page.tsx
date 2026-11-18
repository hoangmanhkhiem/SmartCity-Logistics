'use client';

import ReportIncident from '@/components/shared/report-incident';
import { PageHead, StudioShell, memberNav } from '@/components/studio/shell';

export default function MemberTrafficReportPage() {
    return (
        <StudioShell group="ĐIỀU HÀNH" role="Thành viên" items={memberNav}>
            <PageHead
                title="Báo cáo giao thông"
                eyebrow={null}
                description="Gửi ùn tắc, tai nạn hoặc sự cố trên đường. Sau khi được duyệt, điểm đỏ hiện trên bản đồ giao thông."
                extra={<span className="cq-live"><i /> Dữ liệu trực tiếp</span>}
            />
            <ReportIncident />
        </StudioShell>
    );
}
