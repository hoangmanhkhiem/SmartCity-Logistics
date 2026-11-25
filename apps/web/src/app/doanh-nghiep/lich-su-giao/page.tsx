'use client';

import { useEffect, useState } from 'react';
import { PageHead, StudioShell, orgNav } from '@/components/studio/shell';
import { simulationApi } from '@/api';
import { DataTable, type Column } from '@/components/ui';

type Row = {
    id: number;
    eventType: string;
    occurredAt: string;
    hubName?: string | null;
    organizationName?: string | null;
    wardName?: string | null;
    cargoType?: string | null;
    packageCount?: number | null;
    weightKg?: number | null;
    volumeM3?: number | null;
};

const EVENT_LABEL: Record<string, string> = {
    pickup_mini: 'Nhận tại MiniHub',
    central_out: 'Xuất Hub tổng',
    last_mile: 'Nhập MiniHub giao',
    delivered: 'Giao thành công',
};

export default function DeliveryHistoryPage() {
    const [rows, setRows] = useState<Row[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);

    useEffect(() => {
        simulationApi.history({ page, limit: 10 }).then((res) => {
            setRows(res.data.data || []);
            setTotal(res.data.meta?.total || 0);
        }).catch(() => undefined);
    }, [page]);

    const columns: Column<Row>[] = [
        { key: 'occurredAt', header: 'Thời điểm', render: (r) => new Date(r.occurredAt).toLocaleString('vi-VN') },
        { key: 'eventType', header: 'Sự kiện', render: (r) => EVENT_LABEL[r.eventType] || r.eventType },
        { key: 'organizationName', header: 'Doanh nghiệp' },
        { key: 'hubName', header: 'Hub' },
        { key: 'wardName', header: 'Phường giao' },
        { key: 'cargoType', header: 'Loại hàng' },
        { key: 'packageCount', header: 'Kiện' },
        { key: 'weightKg', header: 'kg' },
        { key: 'volumeM3', header: 'm³' },
    ];

    return (
        <StudioShell group="DOANH NGHIỆP" role="Doanh nghiệp" items={orgNav}>
            <div className="space-y-4">
                <PageHead title="Lịch sử giao hàng dùng chung" description="Chỉ thông tin hàng hóa và hành trình hub → hub. Không có tên, SĐT, địa chỉ khách hàng." />
                <div className="rounded-2xl bg-white p-3">
                    <DataTable
                        data={rows}
                        columns={columns}
                        emptyMessage="Chưa có nhật ký — chạy giả lập đơn trước"
                        pagination={{ page, onPageChange: setPage, total, pageSize: 10, totalPages: Math.max(1, Math.ceil(total / 10)) }}
                    />
                </div>
            </div>
        </StudioShell>
    );
}
