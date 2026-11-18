export type IssueRow = {
    id: number;
    issueType?: string;
    status?: string;
    zoneId?: number | null;
    note?: string | null;
    latitude?: number;
    longitude?: number;
    reporterHash?: string;
    createdAt?: string;
};

export const ISSUE_TYPE_LABEL: Record<string, string> = {
    congestion: 'Ùn tắc',
    un_tac: 'Ùn tắc',
    long_jam: 'Ùn tắc dài',
    parking: 'Khó đỗ xe',
    restriction: 'Cấm đường',
    accident: 'Tai nạn',
    flood: 'Ngập',
    alley: 'Ngõ hẹp',
    map_error: 'Sai bản đồ',
};

export const REPORT_KINDS: Array<{ value: string; label: string }> = [
    { value: 'congestion', label: 'Ùn tắc / tắc đường' },
    { value: 'long_jam', label: 'Ùn tắc kéo dài' },
    { value: 'accident', label: 'Tai nạn' },
    { value: 'restriction', label: 'Cấm đường / cấm giờ' },
    { value: 'parking', label: 'Không chỗ dừng đỗ' },
    { value: 'flood', label: 'Mưa / ngập' },
    { value: 'alley', label: 'Ngõ nhỏ, khó quay đầu' },
    { value: 'map_error', label: 'Sai vị trí bản đồ' },
];

export function issueTypeLabel(type?: string) {
    if (!type) return 'Khác';
    return ISSUE_TYPE_LABEL[type] || type;
}

export function issueStatusLabel(status?: string) {
    if (status === 'approved') return 'Đã duyệt';
    if (status === 'rejected') return 'Từ chối';
    return 'Chờ xác minh';
}

export function isPendingStatus(status?: string) {
    return status !== 'approved' && status !== 'rejected';
}

export function relativeTimeVi(iso?: string) {
    if (!iso) return '—';
    const diff = Date.now() - new Date(iso).getTime();
    const min = Math.max(1, Math.round(diff / 60000));
    if (min < 60) return `${min} phút trước`;
    const hr = Math.round(min / 60);
    if (hr < 24) return `${hr} giờ trước`;
    const day = Math.round(hr / 24);
    return `${day} ngày trước`;
}

export function reporterLabel(hash?: string, index = 0) {
    if (!hash) return `NB-${String(index + 1).padStart(2, '0')}`;
    return hash.slice(0, 2).toUpperCase();
}
