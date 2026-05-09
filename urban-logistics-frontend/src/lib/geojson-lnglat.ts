/** Đồng bộ heuristic với backend — GeoJSON cần [lng, lat]. */
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

/** Chuẩn hóa FeatureCollection từ API (LineString [lng,lat]). */
export function normalizeRestrictionFeatureCollection(fc: unknown): unknown {
    const c = fc as {
        type?: string;
        features?: Array<{
            geometry?: { type?: string; coordinates?: number[][] };
            [k: string]: unknown;
        }>;
        [k: string]: unknown;
    };
    if (!c?.features?.length) return fc;
    return {
        ...c,
        features: c.features.map((f) => {
            const g = f.geometry;
            if (g?.type === 'LineString' && Array.isArray(g.coordinates)) {
                return {
                    ...f,
                    geometry: {
                        ...g,
                        coordinates: normalizeLineStringCoordinates(g.coordinates),
                    },
                };
            }
            return f;
        }),
    };
}
