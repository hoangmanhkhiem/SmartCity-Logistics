'use client';

import RoutePlanner from '@/components/shared/route-planner';
import { PageHead, StudioShell, orgNav } from '@/components/studio/shell';

export default function OrgRoutePage() {
    return (
        <StudioShell group="DOANH NGHIỆP" role="Quản trị DN" items={orgNav}>
            <PageHead
                title="Tìm đường thuận lợi"
                eyebrow="TRUNG TÂM ĐIỀU HÀNH"
                description="Lập tuyến A → B cho đội xe: né cấm/tắc nhiều nhất, thời gian thấp nhất."
            />
            <RoutePlanner />
        </StudioShell>
    );
}
