/**
 * Mã trạng thái snake_case từ API → nhãn tiếng Việt (UI).
 */
const LABELS: Record<string, string> = {
    // Xe
    available: 'Sẵn sàng',
    in_use: 'Đang chạy',
    maintenance: 'Bảo trì',

    // Đơn hàng
    pending: 'Chờ xử lý',
    confirmed: 'Đã xác nhận',
    shipped: 'Đang giao',
    delivered: 'Đã giao',
    cancelled: 'Đã hủy',
    in_transit: 'Đang giao',

    // Tuyến
    planned: 'Dự kiến',
    active: 'Đang chạy',
    completed: 'Hoàn thành',

    // Vận đơn / lô (shipment)
    // pending, in_transit, delivered đã có ở trên

    // Chặng (leg)
    in_progress: 'Đang thực hiện',

    // Phân công (assignment)
    assigned: 'Đã phân công',

    // Điểm dừng (stop) — nếu API trả về
    arrived: 'Đã đến',
    departed: 'Đã rời',
    skipped: 'Bỏ qua',
};

export function viStatus(status: string | null | undefined): string {
    if (status == null || String(status).trim() === '') return '—';
    const key = String(status).trim().toLowerCase();
    return LABELS[key] ?? status;
}

export const VEHICLE_STATUS_OPTIONS = [
    { value: 'available', label: LABELS.available },
    { value: 'in_use', label: LABELS.in_use },
    { value: 'maintenance', label: LABELS.maintenance },
] as const;

export const ORDER_STATUS_OPTIONS = [
    { value: 'pending', label: LABELS.pending },
    { value: 'confirmed', label: LABELS.confirmed },
    { value: 'shipped', label: LABELS.shipped },
    { value: 'delivered', label: LABELS.delivered },
    { value: 'cancelled', label: LABELS.cancelled },
] as const;

export const ROUTE_STATUS_OPTIONS = [
    { value: 'planned', label: LABELS.planned },
    { value: 'active', label: LABELS.active },
    { value: 'completed', label: LABELS.completed },
] as const;
