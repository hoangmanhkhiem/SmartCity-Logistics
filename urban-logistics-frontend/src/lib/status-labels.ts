/**
 * Mã trạng thái snake_case từ API → nhãn tiếng Việt (UI).
 */
const LABELS: Record<string, string> = {
    // Xe
    available: 'Sẵn sàng',
    in_use: 'Đang chạy',
    maintenance: 'Bảo trì',

    // Đơn hàng (khớp ORDER_STATUSES ở backend order.dto.ts)
    pending: 'Chờ xử lý',
    assigned: 'Đã gom chuyến',
    in_transit: 'Đang giao',
    delivered: 'Đã giao',
    failed: 'Giao thất bại',
    cancelled: 'Đã hủy',

    // Chuyến giao (route) — khớp ROUTE_STATUSES ở backend route.dto.ts
    planned: 'Dự kiến',
    in_progress: 'Đang thực hiện',
    completed: 'Hoàn thành',

    // Điểm dừng (stop)
    arrived: 'Đã đến',
    departed: 'Đã rời',
    skipped: 'Bỏ qua',
};

export function viStatus(status: string | null | undefined): string {
    if (status == null || String(status).trim() === '') return '—';
    const key = String(status).trim().toLowerCase();
    return LABELS[key] ?? status;
}

/**
 * Màu badge dùng chung cho mọi trạng thái tiến trình (order/route/stop) —
 * cùng ý nghĩa (chờ/đang xử lý/hoàn thành/lỗi) thì cùng màu ở mọi trang.
 */
const STATUS_VARIANT: Record<string, 'warning' | 'info' | 'success' | 'error' | 'default'> = {
    pending: 'warning',
    planned: 'warning',
    assigned: 'info',
    in_transit: 'info',
    in_progress: 'info',
    arrived: 'info',
    delivered: 'success',
    completed: 'success',
    departed: 'success',
    failed: 'error',
    cancelled: 'error',
    skipped: 'default',
};

export function statusVariant(status: string | null | undefined): 'warning' | 'info' | 'success' | 'error' | 'default' {
    if (!status) return 'default';
    return STATUS_VARIANT[String(status).trim().toLowerCase()] ?? 'default';
}

export const VEHICLE_STATUS_OPTIONS = [
    { value: 'available', label: LABELS.available },
    { value: 'in_use', label: LABELS.in_use },
    { value: 'maintenance', label: LABELS.maintenance },
] as const;

export const ORDER_STATUS_OPTIONS = [
    { value: 'pending', label: LABELS.pending },
    { value: 'assigned', label: LABELS.assigned },
    { value: 'in_transit', label: LABELS.in_transit },
    { value: 'delivered', label: LABELS.delivered },
    { value: 'failed', label: LABELS.failed },
    { value: 'cancelled', label: LABELS.cancelled },
] as const;

export const ROUTE_STATUS_OPTIONS = [
    { value: 'planned', label: LABELS.planned },
    { value: 'in_progress', label: LABELS.in_progress },
    { value: 'completed', label: LABELS.completed },
    { value: 'cancelled', label: LABELS.cancelled },
] as const;
