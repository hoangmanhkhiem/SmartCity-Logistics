'use client';

import ReportIncident from '@/components/shared/report-incident';
import { PageHead, StudioShell, researchNav } from '@/components/studio/shell';

export default function ResearchIncidentPage() {
    return (
        <StudioShell group="NGHIÊN CỨU" role="Nghiên cứu viên" items={researchNav}>
            <PageHead
                title="Báo cáo ùn tắc & sự cố"
                crumb="Báo cáo ùn tắc & sự cố"
                eyebrow="NGHIÊN CỨU & VẬN HÀNH"
                description="Cùng cập nhật tình hình giao thông thực tế, giúp mọi hành trình thuận lợi hơn."
                extra={<span className="cq-live"><i /> Dữ liệu trực tiếp</span>}
            />
            <ReportIncident />
        </StudioShell>
    );
}
