/** Múi giờ cố định cho lọc khung giờ cấm đường */
export const VN_TIMEZONE = 'Asia/Ho_Chi_Minh';

const LOCALE_WEEKDAY_LONG_TO_SHORT: Record<string, string> = {
    Monday: 'Mon',
    Tuesday: 'Tue',
    Wednesday: 'Wed',
    Thursday: 'Thu',
    Friday: 'Fri',
    Saturday: 'Sat',
    Sunday: 'Sun',
};

export function parseHHmmToMinutes(hhmm: string | null | undefined): number | null {
    if (!hhmm || typeof hhmm !== 'string') return null;
    const m = hhmm.trim().match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return null;
    const h = Number(m[1]);
    const min = Number(m[2]);
    if (h < 0 || h > 23 || min < 0 || min > 59) return null;
    return h * 60 + min;
}

export function getVietnamWeekdayShort(date: Date): string {
    const long = date.toLocaleDateString('en-US', { timeZone: VN_TIMEZONE, weekday: 'long' });
    if (LOCALE_WEEKDAY_LONG_TO_SHORT[long]) return LOCALE_WEEKDAY_LONG_TO_SHORT[long];
    return date.toLocaleDateString('en-US', { timeZone: VN_TIMEZONE, weekday: 'short' });
}

export function getVietnamMinutesFromMidnight(date: Date): number {
    const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: VN_TIMEZONE,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).formatToParts(date);
    const h = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
    const m = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
    return h * 60 + m;
}

/**
 * Khớp daysOfWeek (Mon,Tue,...) — mảng rỗng = mọi ngày.
 */
export function matchesDayOfWeek(at: Date, daysOfWeek: string[]): boolean {
    if (!daysOfWeek?.length) return true;
    const short = getVietnamWeekdayShort(at);
    return daysOfWeek.includes(short);
}

/**
 * Khớp khung HH:mm — thiếu cả hai = coi như cả ngày (sau khi đã khớp ngày).
 * Nếu timeFrom > timeTo: khung qua nửa đêm.
 */
export function matchesTimeWindow(at: Date, timeFrom: string | null | undefined, timeTo: string | null | undefined): boolean {
    const fromM = parseHHmmToMinutes(timeFrom ?? undefined);
    const toM = parseHHmmToMinutes(timeTo ?? undefined);
    if (fromM === null && toM === null) return true;
    if (fromM === null || toM === null) return true;

    const cur = getVietnamMinutesFromMidnight(at);
    if (fromM <= toM) {
        return cur >= fromM && cur <= toM;
    }
    return cur >= fromM || cur <= toM;
}

export function severityToColor(severity: string): string {
    switch (severity) {
        case 'prohibited':
            return '#dc2626';
        case 'allowed_window':
            return '#16a34a';
        default:
            return '#ea580c';
    }
}
