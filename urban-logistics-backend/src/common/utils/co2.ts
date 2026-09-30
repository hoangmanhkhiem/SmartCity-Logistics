/**
 * Hệ số phát thải mặc định theo loại xe (gCO2/km) — dùng khi vehicle.emissionFactor chưa được set.
 * Xe điện (isElectric=true) dùng hệ số riêng, thấp hơn vì chỉ tính phát thải gián tiếp từ điện lưới VN.
 */
const DEFAULT_EMISSION_FACTOR_BY_TYPE: Record<string, number> = {
    bike: 60,
    motorbike: 60,
    van: 180,
    small_van: 180,
    truck: 350,
    'e-bike': 15,
    e_bike: 15,
    e_van: 15,
};

const DEFAULT_ELECTRIC_EMISSION_FACTOR = 15;
const DEFAULT_FALLBACK_EMISSION_FACTOR = 180; // van — dùng khi không xác định được loại xe

/** Phát thải tăng thêm tối đa 30% khi xe chở đầy tải so với chạy không hàng. */
const MAX_LOAD_FACTOR_BONUS = 0.3;

/**
 * CO2 (gram) = distanceKm × emissionFactor(vehicle) × loadFactor(weightKg, capacityKg)
 * Ước lượng dùng cho báo cáo/dashboard — không phải số liệu kiểm toán carbon chính thức.
 */
export function calculateRouteCo2Grams(params: {
    distanceKm: number;
    vehicleType: string;
    isElectric?: boolean | null;
    emissionFactor?: number | null;
    totalWeightKg?: number | null;
    vehicleCapacityKg?: number | null;
}): number {
    const { distanceKm, vehicleType, isElectric, emissionFactor, totalWeightKg, vehicleCapacityKg } = params;
    if (!distanceKm || distanceKm <= 0) return 0;

    const factor =
        emissionFactor ??
        (isElectric ? DEFAULT_ELECTRIC_EMISSION_FACTOR : DEFAULT_EMISSION_FACTOR_BY_TYPE[vehicleType] ?? DEFAULT_FALLBACK_EMISSION_FACTOR);

    const loadRatio = vehicleCapacityKg && vehicleCapacityKg > 0 ? Math.min((totalWeightKg ?? 0) / vehicleCapacityKg, 1) : 0;
    const loadFactor = 1 + loadRatio * MAX_LOAD_FACTOR_BONUS;

    return Math.round(distanceKm * factor * loadFactor);
}
