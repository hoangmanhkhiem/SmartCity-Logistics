/**
 * GeoJSON LineString bắt buộc [longitude, latitude].
 * Nhiều người nhập/sửa nhầm thành [lat, lng] → bản đồ không hiện hoặc nhảy sai vị trí.
 */
export function normalizeLngLatPair(pair: number[]): [number, number] {
    if (pair.length < 2) return [pair[0] ?? 0, pair[1] ?? 0];
    const x = Number(pair[0]);
    const y = Number(pair[1]);
    if (Number.isNaN(x) || Number.isNaN(y)) return [x, y];

    const xLikeLat = x >= 6 && x <= 35;
    const yLikeLng = y >= 95 && y <= 125;
    const xLikeLng = x >= 95 && x <= 125;
    const yLikeLat = y >= 6 && y <= 35;

    if (xLikeLat && yLikeLng && !(xLikeLng && yLikeLat)) {
        return [y, x];
    }
    return [x, y];
}

export function normalizeLineStringCoordinates(coords: number[][]): number[][] {
    return coords.map((c) => {
        const pair = c.length >= 2 ? [c[0], c[1]] : c;
        return [...normalizeLngLatPair(pair), ...c.slice(2)];
    });
}

/** Chuỗi geometry JSON trong DB → chuỗi đã chuẩn hóa tọa độ (hoặc null nếu không parse được). */
export function normalizeGeometryJsonString(geometry: string | null | undefined): string | null {
    if (!geometry?.trim()) return null;
    try {
        const g = JSON.parse(geometry) as Record<string, unknown>;
        if (g.type === 'LineString' && Array.isArray(g.coordinates)) {
            g.coordinates = normalizeLineStringCoordinates(g.coordinates as number[][]);
            return JSON.stringify(g);
        }
        if (g.type === 'Feature' && g.geometry && typeof g.geometry === 'object') {
            const geo = g.geometry as { type?: string; coordinates?: number[][] };
            if (geo.type === 'LineString' && Array.isArray(geo.coordinates)) {
                geo.coordinates = normalizeLineStringCoordinates(geo.coordinates);
                return JSON.stringify(g);
            }
        }
    } catch {
        return null;
    }
    return null;
}
