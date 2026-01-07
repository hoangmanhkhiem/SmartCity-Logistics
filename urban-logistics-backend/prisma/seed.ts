import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed...');

    // Clear existing data
    await prisma.$executeRaw`TRUNCATE TABLE "telemetry", "assignments", "stops", "legs", "shipments", "orders", "restrictions", "road_segments", "docks", "fuel_pumps", "chargers", "facilities", "vehicles", "carriers", "memberships", "role_permissions", "permissions", "roles", "zones", "routes", "users", "organizations" RESTART IDENTITY CASCADE`;

    // ==================== ROLES ====================
    console.log('Creating roles...');
    const roles = await Promise.all([
        prisma.role.create({ data: { name: 'admin', displayName: 'Quản trị viên', description: 'Toàn quyền hệ thống', isSystem: true } }),
        prisma.role.create({ data: { name: 'regulator', displayName: 'Cơ quan quản lý', description: 'Giám sát logistics đô thị', isSystem: true } }),
        prisma.role.create({ data: { name: 'carrier_mgr', displayName: 'Quản lý vận tải', description: 'Quản lý đơn vị vận tải', isSystem: true } }),
        prisma.role.create({ data: { name: 'dispatcher', displayName: 'Điều phối viên', description: 'Điều phối đơn hàng', isSystem: true } }),
        prisma.role.create({ data: { name: 'driver', displayName: 'Tài xế', description: 'Tài xế giao hàng', isSystem: true } }),
        prisma.role.create({ data: { name: 'consumer', displayName: 'Người dùng', description: 'Khách hàng', isSystem: true } }),
    ]);

    // ==================== PERMISSIONS ====================
    console.log('Creating permissions...');
    const resources = ['organization', 'carrier', 'vehicle', 'facility', 'zone', 'order', 'route', 'telemetry', 'user'];
    const actions = ['read', 'write', 'delete', 'manage'];
    const permissions = [];
    for (const resource of resources) {
        for (const action of actions) {
            const perm = await prisma.permission.create({
                data: { name: `${action}_${resource}`, resource, action, description: `${action} ${resource}` }
            });
            permissions.push(perm);
        }
    }

    // Assign permissions to admin role
    for (const perm of permissions) {
        await prisma.rolePermission.create({ data: { roleId: roles[0].id, permissionId: perm.id } });
    }

    // ==================== USERS ====================
    console.log('Creating users...');
    const hashedPassword = await bcrypt.hash('123456', 10);
    const users = await Promise.all([
        prisma.user.create({ data: { email: 'admin@test.com', password: hashedPassword, name: 'Admin System', phone: '0901000001' } }),
        prisma.user.create({ data: { email: 'regulator@test.com', password: hashedPassword, name: 'Nguyễn Văn Quản', phone: '0901000002' } }),
        prisma.user.create({ data: { email: 'manager@ghn.com', password: hashedPassword, name: 'Trần Thị Manager', phone: '0901000003' } }),
        prisma.user.create({ data: { email: 'dispatcher@ghn.com', password: hashedPassword, name: 'Lê Văn Dispatch', phone: '0901000004' } }),
        prisma.user.create({ data: { email: 'driver1@ghn.com', password: hashedPassword, name: 'Phạm Văn Tài Xế', phone: '0901000005' } }),
        prisma.user.create({ data: { email: 'driver2@ghn.com', password: hashedPassword, name: 'Hoàng Minh Driver', phone: '0901000006' } }),
        prisma.user.create({ data: { email: 'customer1@gmail.com', password: hashedPassword, name: 'Nguyễn Thị Khách', phone: '0901000007' } }),
        prisma.user.create({ data: { email: 'customer2@gmail.com', password: hashedPassword, name: 'Trần Văn Mua', phone: '0901000008' } }),
        prisma.user.create({ data: { email: 'customer3@gmail.com', password: hashedPassword, name: 'Lê Thị Shop', phone: '0901000009' } }),
        prisma.user.create({ data: { email: 'logistics@abc.com', password: hashedPassword, name: 'Đỗ Văn Logistics', phone: '0901000010' } }),
        ...Array.from({ length: 10 }, (_, i) =>
            prisma.user.create({ data: { email: `user${i + 11}@test.com`, password: hashedPassword, name: `User ${i + 11}`, phone: `090100001${i + 1}` } })
        ),
    ]);

    // ==================== ORGANIZATIONS ====================
    console.log('Creating organizations...');
    const organizations = await Promise.all([
        prisma.organization.create({ data: { name: 'Sở Giao thông Vận tải Hà Nội', type: 'government', business: 'Quản lý nhà nước', address: 'Số 1 Phố Huế, Hoàn Kiếm, Hà Nội', phone: '024 3825 3456', email: 'sgtvt@hanoi.gov.vn' } }),
        prisma.organization.create({ data: { name: 'Công ty CP Giao Hàng Nhanh (GHN)', type: 'delivery', business: 'Vận chuyển', address: 'Số 405/15 Nguyễn Văn Luông, Q.6, TP.HCM', phone: '1900 636 677', email: 'info@ghn.vn', website: 'https://ghn.vn' } }),
        prisma.organization.create({ data: { name: 'Công ty TNHH GHTK', type: 'delivery', business: 'Vận chuyển', address: 'Số 123 Láng Hạ, Đống Đa, Hà Nội', phone: '1900 6092', email: 'info@ghtk.vn', website: 'https://ghtk.vn' } }),
        prisma.organization.create({ data: { name: 'Shopee Express', type: 'delivery', business: 'Vận chuyển', address: 'Tầng 8, tòa nhà Capital Tower, TP.HCM', phone: '1900 1221', email: 'support@shopee.vn' } }),
        prisma.organization.create({ data: { name: 'Công ty Logistics ABC', type: 'logistics', business: 'Logistics tổng hợp', address: 'KCN Bắc Thăng Long, Hà Nội', phone: '024 1234 5678', email: 'info@abc-logistics.vn' } }),
        prisma.organization.create({ data: { name: 'J&T Express Vietnam', type: 'delivery', business: 'Vận chuyển', address: 'Số 72 Lê Thánh Tôn, Q.1, TP.HCM', phone: '1900 1200', email: 'info@jtexpress.vn' } }),
        prisma.organization.create({ data: { name: 'Viettel Post', type: 'delivery', business: 'Chuyển phát', address: 'Số 1 Giang Văn Minh, Hà Nội', phone: '1900 8095', email: 'info@viettelpost.vn' } }),
        prisma.organization.create({ data: { name: 'Vietnam Post', type: 'logistics', business: 'Bưu chính', address: 'Số 5 Phạm Hùng, Hà Nội', phone: '1900 54 54 81', email: 'info@vnpost.vn' } }),
        ...Array.from({ length: 12 }, (_, i) =>
            prisma.organization.create({ data: { name: `Công ty vận tải ${String.fromCharCode(65 + i)}`, type: i % 2 === 0 ? 'delivery' : 'logistics', business: 'Vận tải', address: `Số ${i + 10} Đường ${i + 1}, Hà Nội`, email: `company${i + 1}@test.vn` } })
        ),
    ]);

    // ==================== MEMBERSHIPS ====================
    console.log('Creating memberships...');
    await Promise.all([
        prisma.membership.create({ data: { userId: users[0].id, organizationId: organizations[0].id, roleId: roles[0].id, isDefault: true } }),
        prisma.membership.create({ data: { userId: users[1].id, organizationId: organizations[0].id, roleId: roles[1].id, isDefault: true } }),
        prisma.membership.create({ data: { userId: users[2].id, organizationId: organizations[1].id, roleId: roles[2].id, isDefault: true } }),
        prisma.membership.create({ data: { userId: users[3].id, organizationId: organizations[1].id, roleId: roles[3].id, isDefault: true } }),
        prisma.membership.create({ data: { userId: users[4].id, organizationId: organizations[1].id, roleId: roles[4].id, isDefault: true } }),
        prisma.membership.create({ data: { userId: users[5].id, organizationId: organizations[1].id, roleId: roles[4].id, isDefault: true } }),
        prisma.membership.create({ data: { userId: users[6].id, organizationId: organizations[1].id, roleId: roles[5].id, isDefault: true } }),
        prisma.membership.create({ data: { userId: users[7].id, organizationId: organizations[2].id, roleId: roles[5].id, isDefault: true } }),
        prisma.membership.create({ data: { userId: users[9].id, organizationId: organizations[4].id, roleId: roles[2].id, isDefault: true } }),
    ]);

    // ==================== CARRIERS ====================
    console.log('Creating carriers...');
    const carriers = await Promise.all([
        prisma.carrier.create({ data: { organizationId: organizations[1].id, name: 'GHN Express', scale: 'Lớn', vehicleCount: 500, warehouseCount: 50, contactName: 'Trần Thị Manager', contactPhone: '0901000003' } }),
        prisma.carrier.create({ data: { organizationId: organizations[2].id, name: 'GHTK Standard', scale: 'Lớn', vehicleCount: 400, warehouseCount: 40, contactName: 'Nguyễn Văn GHTK', contactPhone: '0902000001' } }),
        prisma.carrier.create({ data: { organizationId: organizations[3].id, name: 'Shopee Express', scale: 'Lớn', vehicleCount: 300, warehouseCount: 30, contactName: 'Lê Shopee', contactPhone: '0903000001' } }),
        prisma.carrier.create({ data: { organizationId: organizations[5].id, name: 'J&T Express', scale: 'Trung bình', vehicleCount: 200, warehouseCount: 25, contactName: 'JT Manager', contactPhone: '0904000001' } }),
        prisma.carrier.create({ data: { organizationId: organizations[6].id, name: 'Viettel Post', scale: 'Lớn', vehicleCount: 600, warehouseCount: 100, contactName: 'Viettel Manager', contactPhone: '0905000001' } }),
        ...Array.from({ length: 15 }, (_, i) =>
            prisma.carrier.create({ data: { organizationId: organizations[Math.min(i % 8, 7)].id, name: `Carrier ${i + 6}`, scale: i % 3 === 0 ? 'Lớn' : 'Nhỏ', vehicleCount: 50 + i * 10, warehouseCount: 5 + i } })
        ),
    ]);

    // ==================== ZONES ====================
    console.log('Creating zones...');
    const zones = await Promise.all([
        prisma.zone.create({ data: { name: 'Quận Hoàn Kiếm', type: 'district', description: 'Trung tâm Hà Nội' } }),
        prisma.zone.create({ data: { name: 'Quận Ba Đình', type: 'district', description: 'Khu vực hành chính' } }),
        prisma.zone.create({ data: { name: 'Quận Đống Đa', type: 'district', description: 'Khu dân cư đông đúc' } }),
        prisma.zone.create({ data: { name: 'Quận Cầu Giấy', type: 'district', description: 'Khu công nghệ' } }),
        prisma.zone.create({ data: { name: 'Quận Thanh Xuân', type: 'district', description: 'Khu dân cư mới' } }),
        prisma.zone.create({ data: { name: 'Quận Hai Bà Trưng', type: 'district', description: 'Khu trung tâm' } }),
        prisma.zone.create({ data: { name: 'LEZ Hoàn Kiếm', type: 'lez', description: 'Vùng phát thải thấp quanh Hồ Gươm' } }),
        prisma.zone.create({ data: { name: 'Khu vực cấm giờ cao điểm', type: 'restricted', description: 'Cấm xe tải 6h-9h, 16h-19h' } }),
        ...Array.from({ length: 12 }, (_, i) =>
            prisma.zone.create({ data: { name: `Quận ${i + 7}`, type: 'district', description: `Quận ${i + 7} Hà Nội` } })
        ),
    ]);

    // ==================== FACILITIES ====================
    console.log('Creating facilities...');
    const facilities = await Promise.all([
        prisma.facility.create({ data: { organizationId: organizations[1].id, zoneId: zones[3].id, name: 'Hub GHN Cầu Giấy', kind: 'hub', latitude: 21.0285, longitude: 105.78, address: 'Số 18 Phạm Hùng, Cầu Giấy', capacity: 500 } }),
        prisma.facility.create({ data: { organizationId: organizations[1].id, zoneId: zones[4].id, name: 'Kho GHN Thanh Xuân', kind: 'warehouse', latitude: 20.9933, longitude: 105.7980, address: 'Số 5 Khuất Duy Tiến', capacity: 1000 } }),
        prisma.facility.create({ data: { organizationId: organizations[4].id, zoneId: zones[2].id, name: 'Trạm sạc ABC Đống Đa', kind: 'charging_station', latitude: 21.0150, longitude: 105.82, address: 'Số 99 Láng Hạ', capacity: 20 } }),
        prisma.facility.create({ data: { organizationId: organizations[4].id, zoneId: zones[1].id, name: 'Trạm xăng ABC Ba Đình', kind: 'fuel_station', latitude: 21.0360, longitude: 105.81, address: 'Số 1 Kim Mã', capacity: 50 } }),
        prisma.facility.create({ data: { organizationId: organizations[2].id, zoneId: zones[5].id, name: 'Hub GHTK Hai Bà Trưng', kind: 'hub', latitude: 21.0080, longitude: 105.85, address: 'Số 200 Bạch Mai', capacity: 400 } }),
        prisma.facility.create({ data: { organizationId: organizations[3].id, zoneId: zones[0].id, name: 'MFC Shopee Hoàn Kiếm', kind: 'mfc', latitude: 21.0280, longitude: 105.85, address: 'Số 10 Tràng Tiền', capacity: 100 } }),
        ...Array.from({ length: 14 }, (_, i) =>
            prisma.facility.create({
                data: {
                    organizationId: organizations[i % 8].id,
                    zoneId: zones[i % 8].id,
                    name: `Facility ${i + 7}`,
                    kind: ['hub', 'warehouse', 'charging_station', 'fuel_station'][i % 4],
                    latitude: 21.0 + (Math.random() * 0.1),
                    longitude: 105.8 + (Math.random() * 0.1),
                    capacity: 100 + i * 50
                }
            })
        ),
    ]);

    // ==================== CHARGERS & FUEL PUMPS ====================
    console.log('Creating chargers and fuel pumps...');
    for (const facility of facilities.filter(f => f.kind === 'charging_station').slice(0, 5)) {
        for (let i = 0; i < 4; i++) {
            await prisma.charger.create({ data: { facilityId: facility.id, type: i % 2 === 0 ? 'DC' : 'AC', connectorType: 'CCS', powerKw: i % 2 === 0 ? 150 : 22, slots: 2 } });
        }
    }
    for (const facility of facilities.filter(f => f.kind === 'fuel_station').slice(0, 5)) {
        for (const fuel of ['RON95', 'E5', 'Diesel']) {
            await prisma.fuelPump.create({ data: { facilityId: facility.id, fuelType: fuel, pricePerLiter: fuel === 'Diesel' ? 21000 : 24000 } });
        }
    }

    // ==================== DOCKS ====================
    console.log('Creating docks...');
    for (const facility of facilities.filter(f => f.kind === 'hub' || f.kind === 'warehouse').slice(0, 6)) {
        for (let i = 0; i < 3; i++) {
            await prisma.dock.create({ data: { facilityId: facility.id, name: `Dock ${i + 1}`, capacity: 5 + i * 2 } });
        }
    }

    // ==================== VEHICLES ====================
    console.log('Creating vehicles...');
    const vehicleTypes = ['bike', 'van', 'truck', 'e-scooter', 'e-bike'];
    const vehicles = await Promise.all(
        Array.from({ length: 20 }, (_, i) =>
            prisma.vehicle.create({
                data: {
                    carrierId: carriers[i % 5].id,
                    type: vehicleTypes[i % 5],
                    plate: `29${String.fromCharCode(65 + i % 26)}-${10000 + i}`,
                    brand: ['Honda', 'Toyota', 'Hyundai', 'Vinfast', 'Ford'][i % 5],
                    model: `Model ${i + 1}`,
                    year: 2020 + (i % 4),
                    capacity: 50 + i * 20,
                    volume: 0.5 + i * 0.2,
                    fuelType: i % 3 === 0 ? 'Electric' : 'Gasoline',
                    isElectric: i % 3 === 0,
                    emissionStandard: 'EURO 5',
                    emissionFactor: i % 3 === 0 ? 0 : 120 + i * 5,
                    status: ['available', 'in_use', 'maintenance'][i % 3]
                }
            })
        )
    );

    // ==================== ROAD SEGMENTS & RESTRICTIONS ====================
    console.log('Creating road segments and restrictions...');
    const roads = await Promise.all(
        Array.from({ length: 20 }, (_, i) =>
            prisma.roadSegment.create({
                data: {
                    zoneId: zones[i % 8].id,
                    name: `Đường ${['Phạm Hùng', 'Láng Hạ', 'Kim Mã', 'Giải Phóng', 'Nguyễn Trãi', 'Trường Chinh', 'Cầu Giấy', 'Xuân Thủy'][i % 8]} đoạn ${i + 1}`,
                    osmId: `way/${100000 + i}`,
                    oneWay: i % 3 === 0,
                    speedLimit: 40 + (i % 3) * 10,
                    lanes: 2 + (i % 3),
                    roadType: ['primary', 'secondary', 'tertiary'][i % 3]
                }
            })
        )
    );

    for (let i = 0; i < 10; i++) {
        await prisma.restriction.create({
            data: {
                roadSegmentId: roads[i % roads.length].id,
                zoneId: zones[i % 8].id,
                vehicleType: i % 2 === 0 ? 'truck' : null,
                maxWeight: i % 2 === 0 ? 3500 : null,
                timeFrom: '07:00',
                timeTo: '09:00',
                daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
                allowed: false,
                description: `Hạn chế ${i + 1}`
            }
        });
    }

    // ==================== ROUTES ====================
    console.log('Creating routes...');
    const routes = await Promise.all(
        Array.from({ length: 20 }, (_, i) =>
            prisma.route.create({
                data: {
                    name: `Tuyến ${['Cầu Giấy - Thanh Xuân', 'Ba Đình - Đống Đa', 'Hoàn Kiếm - Hai Bà Trưng', 'Long Biên - Gia Lâm'][i % 4]} #${i + 1}`,
                    mode: ['road', 'bike', 'van', 'truck'][i % 4],
                    description: `Tuyến giao hàng số ${i + 1}`,
                    totalDistance: 5 + i * 2,
                    totalDuration: 15 + i * 5,
                    estimatedCo2: 100 + i * 20,
                    status: ['planned', 'active', 'completed'][i % 3]
                }
            })
        )
    );

    // ==================== ORDERS ====================
    console.log('Creating orders...');
    const orderStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    const orders = await Promise.all(
        Array.from({ length: 20 }, (_, i) =>
            prisma.order.create({
                data: {
                    customerId: users[6 + (i % 4)].id,
                    orderNumber: `ORD-2026-${String(i + 1).padStart(5, '0')}`,
                    status: orderStatuses[i % 5],
                    pickupAddress: `Số ${10 + i} Phố ${['Huế', 'Bà Triệu', 'Trần Hưng Đạo', 'Hai Bà Trưng'][i % 4]}, Hà Nội`,
                    pickupLat: 21.02 + (Math.random() * 0.02),
                    pickupLon: 105.84 + (Math.random() * 0.02),
                    deliveryAddress: `Số ${100 + i} Đường ${['Láng', 'Cầu Giấy', 'Nguyễn Trãi', 'Kim Mã'][i % 4]}, Hà Nội`,
                    deliveryLat: 21.01 + (Math.random() * 0.02),
                    deliveryLon: 105.80 + (Math.random() * 0.02),
                    priority: 1 + (i % 5),
                    notes: i % 3 === 0 ? 'Giao giờ hành chính' : null
                }
            })
        )
    );

    // ==================== SHIPMENTS ====================
    console.log('Creating shipments...');
    const shipments = await Promise.all(
        orders.map((order, i) =>
            prisma.shipment.create({
                data: {
                    orderId: order.id,
                    trackingNo: `TRK${Date.now()}${i}`,
                    weight: 0.5 + i * 0.3,
                    volume: 0.01 + i * 0.005,
                    width: 20 + i,
                    height: 15 + i,
                    length: 30 + i,
                    itemCount: 1 + (i % 5),
                    description: `Lô hàng ${i + 1}`,
                    status: ['pending', 'in_transit', 'delivered'][i % 3]
                }
            })
        )
    );

    // ==================== LEGS ====================
    console.log('Creating legs...');
    const legs = await Promise.all(
        shipments.slice(0, 15).map((shipment, i) =>
            prisma.leg.create({
                data: {
                    shipmentId: shipment.id,
                    routeId: routes[i % routes.length].id,
                    sequence: 1,
                    distance: 5 + i,
                    duration: 20 + i * 5,
                    status: ['pending', 'in_progress', 'completed'][i % 3]
                }
            })
        )
    );

    // ==================== STOPS ====================
    console.log('Creating stops...');
    for (const leg of legs.slice(0, 10)) {
        for (let j = 0; j < 3; j++) {
            await prisma.stop.create({
                data: {
                    legId: leg.id,
                    facilityId: facilities[j % facilities.length].id,
                    sequence: j + 1,
                    type: ['pickup', 'transit', 'delivery'][j],
                    latitude: 21.02 + (Math.random() * 0.02),
                    longitude: 105.82 + (Math.random() * 0.02),
                    status: 'pending'
                }
            });
        }
    }

    // ==================== ASSIGNMENTS ====================
    console.log('Creating assignments...');
    for (let i = 0; i < 15; i++) {
        await prisma.assignment.create({
            data: {
                vehicleId: vehicles[i % vehicles.length].id,
                legId: legs[i % legs.length].id,
                driverId: users[4 + (i % 2)].id,
                status: ['assigned', 'in_progress', 'completed'][i % 3]
            }
        });
    }

    // ==================== TELEMETRY ====================
    console.log('Creating telemetry...');
    for (const vehicle of vehicles.slice(0, 10)) {
        for (let i = 0; i < 5; i++) {
            await prisma.telemetry.create({
                data: {
                    vehicleId: vehicle.id,
                    timestamp: new Date(Date.now() - i * 60000),
                    latitude: 21.02 + (Math.random() * 0.02),
                    longitude: 105.82 + (Math.random() * 0.02),
                    speed: 20 + Math.random() * 40,
                    heading: Math.random() * 360,
                    batteryLevel: vehicle.isElectric ? 50 + Math.random() * 50 : null,
                    fuelLevel: !vehicle.isElectric ? 30 + Math.random() * 70 : null,
                    engineStatus: 'running',
                    odometer: 10000 + Math.random() * 50000
                }
            });
        }
    }

    console.log('✅ Seed completed!');
    console.log(`
📊 Data created:
- Users: 20
- Organizations: 20
- Carriers: 20
- Vehicles: 20
- Facilities: 20
- Zones: 20
- Routes: 20
- Orders: 20
- Shipments: 20
- And more...

🔐 Test accounts:
- admin@test.com / 123456 (Admin)
- regulator@test.com / 123456 (Regulator)
- manager@ghn.com / 123456 (Carrier Manager)
- dispatcher@ghn.com / 123456 (Dispatcher)
- customer1@gmail.com / 123456 (Consumer)
  `);
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
