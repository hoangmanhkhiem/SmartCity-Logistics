/** Demo polygons — gần đúng, sẽ vẽ lại theo QĐ 3273. */

export const LEZ_A_BOUNDARY: GeoJSON.Polygon = {
    type: 'Polygon',
    coordinates: [[
        [105.8462, 21.0368],
        [105.8578, 21.0364],
        [105.8594, 21.0288],
        [105.8576, 21.0206],
        [105.8498, 21.0188],
        [105.8448, 21.0224],
        [105.8442, 21.0306],
        [105.8462, 21.0368],
    ]],
};

export const LEZ_B_BOUNDARY: GeoJSON.Polygon = {
    type: 'Polygon',
    coordinates: [[
        [105.8328, 21.0482],
        [105.8548, 21.0504],
        [105.8686, 21.0416],
        [105.8702, 21.0264],
        [105.8624, 21.0128],
        [105.8462, 21.0086],
        [105.8324, 21.0148],
        [105.8286, 21.0288],
        [105.8304, 21.0408],
        [105.8328, 21.0482],
    ]],
};

export const TRANSFER_A = [
    { name: 'Trạm trung chuyển Bắc (A)', lat: 21.0398, lon: 105.8512 },
    { name: 'Trạm trung chuyển Đông (A)', lat: 21.0284, lon: 105.8608 },
    { name: 'Trạm trung chuyển Nam (A)', lat: 21.0196, lon: 105.8504 },
    { name: 'Trạm trung chuyển Tây (A)', lat: 21.0286, lon: 105.8416 },
];

export const TRANSFER_B = [
    { name: 'Cửa Long Biên (B)', lat: 21.0446, lon: 105.8558 },
    { name: 'Cửa Trần Nhật Duật (B)', lat: 21.0368, lon: 105.8552 },
    { name: 'Cửa Trần Khánh Dư (B)', lat: 21.0248, lon: 105.8634 },
    { name: 'Cửa Đại Cồ Việt (B)', lat: 21.0136, lon: 105.8496 },
    { name: 'Cửa Lê Duẩn (B)', lat: 21.0188, lon: 105.8412 },
    { name: 'Cửa Nguyễn Thái Học (B)', lat: 21.0284, lon: 105.8368 },
    { name: 'Cửa Phan Đình Phùng (B)', lat: 21.0412, lon: 105.8386 },
];
