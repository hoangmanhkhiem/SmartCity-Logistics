'use client';

import RoutePlanner from '@/components/shared/route-planner';
import { PageHead } from '@/components/studio/shell';

export default function AdminRoutePage() {
    return (
        <>
            <PageHead
                title="Tìm đường thuận lợi"
                eyebrow="QUẢN TRỊ HỆ THỐNG"
                description="Tuyến A → B né đường cấm, hạn chế và ùn tắc đã duyệt; nếu nhiều phương án thì lấy thời gian ngắn nhất."
            />
            <RoutePlanner />
        </>
    );
}
