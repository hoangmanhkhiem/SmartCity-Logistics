export const HIGH_DENSITY_WARDS = ['Quận Ba Đình', 'Quận Cầu Giấy', 'Quận Đống Đa'];

export const CENTRAL_HUBS = [
    {
        orgKey: 'A',
        name: 'Hub tổng Mê Linh',
        address: 'KCN Quang Minh, xã Quang Minh, Mê Linh (giả lập)',
        lat: 21.1994,
        lon: 105.7758,
        zoneName: 'Mê Linh',
    },
    {
        orgKey: 'B',
        name: 'Hub tổng Gia Lâm 1',
        address: 'KCN Hapro, Lệ Chi, Gia Lâm — cạnh QL5 (giả lập)',
        lat: 21.0705,
        lon: 105.9612,
        zoneName: 'Gia Lâm',
    },
    {
        orgKey: 'C',
        name: 'Hub tổng Gia Lâm 2',
        address: 'ICD Cổ Bi, Gia Lâm (giả lập)',
        lat: 21.0268,
        lon: 105.9376,
        zoneName: 'Gia Lâm',
    },
] as const;

export const MINI_SITES = [
    { key: 'badinh-1', name: 'MiniHub Ba Đình 1', zoneName: 'Quận Ba Đình', lat: 21.0369, lon: 105.8347, density: 'high' },
    { key: 'badinh-2', name: 'MiniHub Ba Đình 2', zoneName: 'Quận Ba Đình', lat: 21.0415, lon: 105.8212, density: 'high' },
    { key: 'caugiay-1', name: 'MiniHub Cầu Giấy 1', zoneName: 'Quận Cầu Giấy', lat: 21.0332, lon: 105.7945, density: 'high' },
    { key: 'caugiay-2', name: 'MiniHub Cầu Giấy 2', zoneName: 'Quận Cầu Giấy', lat: 21.0288, lon: 105.7802, density: 'high' },
    { key: 'dongda-1', name: 'MiniHub Đống Đa 1', zoneName: 'Quận Đống Đa', lat: 21.0184, lon: 105.8276, density: 'high' },
    { key: 'dongda-2', name: 'MiniHub Đống Đa 2', zoneName: 'Quận Đống Đa', lat: 21.0132, lon: 105.8318, density: 'high' },
    { key: 'hoankiem', name: 'MiniHub Hoàn Kiếm', zoneName: 'Quận Hoàn Kiếm', lat: 21.0288, lon: 105.8522, density: 'normal' },
    { key: 'thanxuan', name: 'MiniHub Thanh Xuân', zoneName: 'Quận Thanh Xuân', lat: 20.9958, lon: 105.8074, density: 'normal' },
] as const;

export const VEHICLE_TEMPLATES = [
    { type: 'motorbike', payloadKg: 30, cargoM3: 0.1, fuelType: 'gasoline', emissionStandard: 'EURO 3', co2GPerKm: 62, lezAllowed: false },
    { type: 'ebike', payloadKg: 40, cargoM3: 0.12, fuelType: 'electric', emissionStandard: 'EV', co2GPerKm: 8, lezAllowed: true },
    { type: 'tricycle', payloadKg: 200, cargoM3: 1.2, fuelType: 'electric', emissionStandard: 'EV', co2GPerKm: 18, lezAllowed: true },
    { type: 'van', payloadKg: 800, cargoM3: 6, fuelType: 'diesel', emissionStandard: 'EURO 5', co2GPerKm: 180, lezAllowed: false },
    { type: 'truck', payloadKg: 1500, cargoM3: 10, fuelType: 'diesel', emissionStandard: 'EURO 5', co2GPerKm: 280, lezAllowed: false },
];

export function mulberry32(seed: number) {
    let a = seed >>> 0;
    return () => {
        a += 0x6d2b79f5;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
