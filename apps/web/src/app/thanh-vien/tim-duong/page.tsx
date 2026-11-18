'use client';

import RoutePlanner from '@/components/shared/route-planner';
import { PageHead, StudioShell, memberNav } from '@/components/studio/shell';

export default function MemberRoutePage() {
    return (
        <StudioShell group="ĐIỀU HÀNH" role="Thành viên" items={memberNav}>
            <PageHead
                title="Tìm đường thuận lợi"
                eyebrow={null}
                description="Từ địa chỉ A đến B: ưu tiên né đường cấm, ùn tắc và khó lưu thông, rồi chọn thời gian thấp nhất."
            />
            <RoutePlanner />
        </StudioShell>
    );
}
