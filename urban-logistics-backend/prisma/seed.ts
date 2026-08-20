import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { createHash } from 'crypto';
import { v4 as uuid } from 'uuid';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed (last-mile đô thị đa hãng)...');

    // Clear existing data (MySQL: no multi-table TRUNCATE, disable FK checks instead)
    const tablesToTruncate = [
        'telemetry', 'stops', 'routes', 'orders', 'shipper_profiles',
        'platform_api_clients', 'restrictions', 'road_segments', 'docks',
        'fuel_pumps', 'chargers', 'facilities', 'vehicles', 'carriers',
        'memberships', 'role_permissions', 'permissions', 'roles', 'zones',
        'users', 'organizations',
    ];
    await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0');
    for (const table of tablesToTruncate) {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE \`${table}\``);
    }
    await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1');

    // ==================== ROLES ====================
    console.log('Creating roles...');
    const roles = await Promise.all([
        prisma.role.create({ data: { name: 'platform_admin', displayName: 'Quản trị nền tảng', description: 'Quản lý carrier đăng ký, user, thiết lập zone/restriction toàn thành phố', isSystem: true } }),
        prisma.role.create({ data: { name: 'regulator', displayName: 'Cơ quan quản lý', description: 'Giám sát logistics đô thị toàn thành phố', isSystem: true } }),
        prisma.role.create({ data: { name: 'carrier_ops', displayName: 'Điều phối viên', description: 'Vận hành carrier: tạo đơn, gom route, giám sát đội xe', isSystem: true } }),
        prisma.role.create({ data: { name: 'shipper', displayName: 'Shipper', description: 'Tài xế giao hàng last-mile', isSystem: true } }),
        prisma.role.create({ data: { name: 'consumer', displayName: 'Khách hàng', description: 'Người đặt đơn / nhận hàng', isSystem: true } }),
    ]);
    const roleByName = Object.fromEntries(roles.map((r) => [r.name, r]));

    // ==================== PERMISSIONS ====================
    console.log('Creating permissions...');
    const resources = ['organization', 'carrier', 'vehicle', 'facility', 'zone', 'order', 'route', 'shipper', 'telemetry', 'user'];
    const actions = ['read', 'write', 'delete', 'manage'];
    const permissions = [];
    for (const resource of resources) {
        for (const action of actions) {
            const perm = await prisma.permission.create({
                data: { name: `${action}_${resource}`, resource, action, description: `${action} ${resource}` },
            });
            permissions.push(perm);
        }
    }
    for (const perm of permissions) {
        await prisma.rolePermission.create({ data: { roleId: roleByName.platform_admin.id, permissionId: perm.id } });
    }

    // ==================== ORGANIZATIONS ====================
    console.log('Creating organizations...');
    const orgPlatform = await prisma.organization.create({
        data: { name: 'Sở Giao thông Vận tải Hà Nội', type: 'government', business: 'Quản lý nhà nước', address: 'Số 1 Phố Huế, Hoàn Kiếm, Hà Nội', phone: '024 3825 3456', email: 'sgtvt@hanoi.gov.vn' },
    });
    const orgA = await prisma.organization.create({
        data: { name: 'FastShip Cầu Giấy', type: 'delivery', business: 'Giao hàng nội đô', address: 'Số 18 Phạm Hùng, Cầu Giấy, Hà Nội', phone: '024 3555 0101', email: 'contact@fastship-cg.vn' },
    });
    const orgB = await prisma.organization.create({
        data: { name: 'GreenBike Đống Đa', type: 'delivery', business: 'Giao hàng xe điện nội đô', address: 'Số 99 Láng Hạ, Đống Đa, Hà Nội', phone: '024 3555 0202', email: 'contact@greenbike.vn' },
    });
    const orgC = await prisma.organization.create({
        data: { name: 'TrustGo Hoàn Kiếm', type: 'delivery', business: 'Giao hàng nội đô', address: 'Số 10 Tràng Tiền, Hoàn Kiếm, Hà Nội', phone: '024 3555 0303', email: 'contact@trustgo.vn' },
    });

    // ==================== ZONES (quận nội thành Hà Nội) ====================
    // Số liệu dân số/mật độ trích từ khảo sát thực địa 6 khu vực thu thập (Cầu Giấy, Đống Đa,
    // Hoàn Kiếm, Cửa Nam, Ba Đình, Giảng Võ) — file _1..._6_*.sql ở gốc repo.
    console.log('Creating zones...');
    const zoneCauGiay = await prisma.zone.create({
        data: {
            name: 'Quận Cầu Giấy',
            type: 'district',
            description: 'Dân số ~25.000–50.000/phường (Dịch Vọng, Dịch Vọng Hậu, Quan Hoa, Mỹ Đình 1&2, Yên Hòa). Mật độ ~18.000–24.000 người/km² (Yên Hòa tới ~77.000 người trên toàn phường sáp nhập). Khu công nghệ, chung cư (Vincom Mega Mall Royal City, Vincom Trần Duy Hưng), TMĐT ~1.500–18.000 đơn/ngày.',
        },
    });
    const zoneDongDa = await prisma.zone.create({
        data: {
            name: 'Quận Đống Đa',
            type: 'district',
            description: 'Dân số ~18.000–38.000/phường (Thịnh Quang, Quang Trung, Láng Hạ, Nam Đồng, Ô Chợ Dừa, Trung Liệt). Mật độ ~22.000–61.000 người/km². TMĐT ~2.400–11.800 đơn/ngày. Khu dân cư đông đúc, DN logistics 30–90/phường.',
        },
    });
    const zoneHoanKiem = await prisma.zone.create({
        data: {
            name: 'Quận Hoàn Kiếm',
            type: 'district',
            description: 'Trung tâm phố cổ Hà Nội — dân số 5.400–18.500/phường (Hàng Bạc, Hàng Bồ, Hàng Buồm, Hàng Đào, Hàng Gai, Hàng Mã, Lý Thái Tổ, Điện Biên, Đồng Xuân). Mật độ cao 17.700–102.000 người/km². Phố hẹp 5–7m, TMĐT 700–20.000 đơn/ngày, nhiều smart locker (GHTK, Viettel Post, J&T, Shopee).',
        },
    });
    const zoneBaDinh = await prisma.zone.create({
        data: {
            name: 'Quận Ba Đình',
            type: 'district',
            description: 'Khu vực hành chính — Quán Thánh, Trúc Bạch, Điện Biên, Đội Cấn, Kim Mã, Ngọc Hà. Dân số ~8.700–93.500/phường, mật độ ~9.400–34.900 người/km². Nhiều cơ quan nhà nước, đại sứ quán (Trung Quốc, Nhật Bản, Hàn Quốc...), chung cư lớn (Vinhomes Metropolis, Grandeur Palace Giảng Võ).',
        },
    });
    const zoneThanhXuan = await prisma.zone.create({
        data: { name: 'Quận Thanh Xuân', type: 'district', description: 'Khu dân cư mới, mật độ dân số tăng nhanh, giáp ranh Cầu Giấy và Đống Đa.' },
    });
    const zoneLezHoanKiem = await prisma.zone.create({
        data: { name: 'LEZ Hoàn Kiếm', type: 'lez', description: 'Vùng phát thải thấp quanh Hồ Gươm (Lý Thái Tổ, Đinh Tiên Hoàng) — camera AI phạt tự động, chỉ ưu tiên xe máy/xe đạp điện, cấm xe tải >1 tấn 24/24.' },
    });
    const zonePeakHour = await prisma.zone.create({
        data: {
            name: 'Khu vực cấm giờ cao điểm nội đô',
            type: 'restricted',
            description: 'Áp dụng khung giờ cấm xe tải theo quy định UBND TP Hà Nội hiệu lực từ 15/1/2026: xe ≥2 tấn chỉ được chạy 21:00–06:00; giờ cao điểm 06:00–09:00 và 16:00–19:30 hạn chế xe nặng; xe 2–10 tấn cần Công an TP chấp thuận văn bản, xe ≥10 tấn cần Sở Xây dựng chấp thuận văn bản.',
        },
    });
    const zoneCuaNam = await prisma.zone.create({
        data: {
            name: 'Phường Cửa Nam',
            type: 'ward',
            description: 'Hàng Bài, Phan Chu Trinh, Trần Hưng Đạo, một phần Nguyễn Du/Cửa Nam/Phạm Đình Hổ, Hàng Bông, Hàng Trống, Tràng Tiền. Dân số 250–12.846/khu, mật độ 12.800–43.126 người/km². Trung tâm buôn bán vải vóc lụa, phố đi bộ cao cấp (Tràng Tiền Plaza, kem Tràng Tiền).',
        },
    });
    const zoneGiangVo = await prisma.zone.create({
        data: {
            name: 'Phường Giảng Võ',
            type: 'ward',
            description: 'Giảng Võ, Cát Linh, Láng Hạ, Kim Mã, Ngọc Khánh, Thành Công, Cống Vị. Dân số 932–27.578/khu, mật độ 24.265–53.558 người/km². Nhiều chung cư lớn (Grandeur Palace, Vinhomes Metropolis), văn phòng, chợ Thành Công.',
        },
    });
    const zones = [zoneCauGiay, zoneDongDa, zoneHoanKiem, zoneBaDinh, zoneThanhXuan];

    // ==================== CARRIERS (last-mile nội đô, mỗi carrier phụ trách zone riêng) ====================
    console.log('Creating carriers...');
    const carrierA = await prisma.carrier.create({
        data: {
            organizationId: orgA.id,
            name: 'FastShip Cầu Giấy',
            operatingZoneIds: [zoneCauGiay.id, zoneThanhXuan.id],
            serviceType: 'last_mile',
            contactName: 'Trần Thị Mai',
            contactPhone: '0901000101',
            contactEmail: 'ops@fastship-cg.vn',
        },
    });
    const carrierB = await prisma.carrier.create({
        data: {
            organizationId: orgB.id,
            name: 'GreenBike Đống Đa',
            operatingZoneIds: [zoneDongDa.id, zoneBaDinh.id],
            serviceType: 'last_mile',
            contactName: 'Nguyễn Văn Bình',
            contactPhone: '0901000102',
            contactEmail: 'ops@greenbike.vn',
        },
    });
    const carrierC = await prisma.carrier.create({
        data: {
            organizationId: orgC.id,
            name: 'TrustGo Hoàn Kiếm',
            operatingZoneIds: [zoneHoanKiem.id, zoneLezHoanKiem.id],
            serviceType: 'last_mile',
            contactName: 'Lê Thị Hoa',
            contactPhone: '0901000103',
            contactEmail: 'ops@trustgo.vn',
        },
    });
    const carriers = [carrierA, carrierB, carrierC];

    // ==================== PLATFORM API KEY (dev) ====================
    const devPartnerApiKey = 'ulc_live_dev_integration_replace_in_production';
    const devKeyHash = createHash('sha256').update(devPartnerApiKey).digest('hex');
    await prisma.platformApiClient.create({
        data: {
            carrierId: carrierA.id,
            name: 'Dev shop / TMĐT (test)',
            keyPrefix: devPartnerApiKey.slice(0, 20),
            keyHash: devKeyHash,
            scopes: ['orders:create'],
        },
    });
    console.log(`🔑 Dev partner API key (X-Api-Key): ${devPartnerApiKey}`);

    // ==================== USERS ====================
    console.log('Creating users...');
    const hashedPassword = bcrypt.hashSync('123456', 10);

    const adminUser = await prisma.user.create({ data: { email: 'admin@platform.vn', password: hashedPassword, name: 'Admin Nền Tảng', phone: '0900000001' } });
    const regulatorUser = await prisma.user.create({ data: { email: 'regulator@hanoi.gov.vn', password: hashedPassword, name: 'Nguyễn Văn Quản', phone: '0900000002' } });

    const opsA = await prisma.user.create({ data: { email: 'ops@fastship-cg.vn', password: hashedPassword, name: 'Trần Thị Mai', phone: '0901000101' } });
    const opsB = await prisma.user.create({ data: { email: 'ops@greenbike.vn', password: hashedPassword, name: 'Nguyễn Văn Bình', phone: '0901000102' } });
    const opsC = await prisma.user.create({ data: { email: 'ops@trustgo.vn', password: hashedPassword, name: 'Lê Thị Hoa', phone: '0901000103' } });

    const shipperUsers = await Promise.all(
        Array.from({ length: 9 }, (_, i) =>
            prisma.user.create({
                data: {
                    email: `shipper${i + 1}@lastmile.vn`,
                    password: hashedPassword,
                    name: `Shipper ${i + 1}`,
                    phone: `090200${String(i + 1).padStart(4, '0')}`,
                },
            }),
        ),
    );

    const customerUsers = await Promise.all(
        Array.from({ length: 8 }, (_, i) =>
            prisma.user.create({
                data: {
                    email: `customer${i + 1}@gmail.com`,
                    password: hashedPassword,
                    name: `Khách hàng ${i + 1}`,
                    phone: `090300${String(i + 1).padStart(4, '0')}`,
                },
            }),
        ),
    );

    // ==================== MEMBERSHIPS ====================
    console.log('Creating memberships...');
    await Promise.all([
        prisma.membership.create({ data: { userId: adminUser.id, organizationId: orgPlatform.id, roleId: roleByName.platform_admin.id, isDefault: true } }),
        prisma.membership.create({ data: { userId: regulatorUser.id, organizationId: orgPlatform.id, roleId: roleByName.regulator.id, isDefault: true } }),
        prisma.membership.create({ data: { userId: opsA.id, organizationId: orgA.id, roleId: roleByName.carrier_ops.id, isDefault: true } }),
        prisma.membership.create({ data: { userId: opsB.id, organizationId: orgB.id, roleId: roleByName.carrier_ops.id, isDefault: true } }),
        prisma.membership.create({ data: { userId: opsC.id, organizationId: orgC.id, roleId: roleByName.carrier_ops.id, isDefault: true } }),
        ...shipperUsers.map((u, i) =>
            prisma.membership.create({
                data: {
                    userId: u.id,
                    organizationId: [orgA, orgB, orgC][i % 3].id,
                    roleId: roleByName.shipper.id,
                    isDefault: true,
                },
            }),
        ),
        ...customerUsers.map((u) =>
            prisma.membership.create({ data: { userId: u.id, organizationId: orgPlatform.id, roleId: roleByName.consumer.id, isDefault: true } }),
        ),
    ]);

    // ==================== VEHICLES (xe máy / xe tải nhỏ, per carrier) ====================
    console.log('Creating vehicles...');
    const vehicleTypesLastMile = ['motorbike', 'e-bike', 'small_van'];
    const vehiclesByCarrier: Record<number, Awaited<ReturnType<typeof prisma.vehicle.create>>[]> = {};
    for (const carrier of carriers) {
        const vs = await Promise.all(
            Array.from({ length: 6 }, (_, i) =>
                prisma.vehicle.create({
                    data: {
                        carrierId: carrier.id,
                        type: vehicleTypesLastMile[i % 3],
                        plate: `29${String.fromCharCode(65 + carrier.id)}${carrier.id}-${10000 + i}`,
                        brand: ['Honda', 'Yamaha', 'Vinfast'][i % 3],
                        model: `Model ${i + 1}`,
                        year: 2021 + (i % 4),
                        capacity: i % 3 === 2 ? 500 : 30 + i * 5,
                        volume: i % 3 === 2 ? 3 : 0.15,
                        fuelType: i % 2 === 0 ? 'Electric' : 'Gasoline',
                        isElectric: i % 2 === 0,
                        emissionStandard: 'EURO 5',
                        emissionFactor: i % 2 === 0 ? 0 : 60 + i * 5,
                        status: i === 5 ? 'maintenance' : 'available',
                    },
                }),
            ),
        );
        vehiclesByCarrier[carrier.id] = vs;
    }

    // ==================== SHIPPER PROFILES ====================
    console.log('Creating shipper profiles...');
    const shipperProfiles = await Promise.all(
        shipperUsers.map((u, i) => {
            const carrier = [carrierA, carrierB, carrierC][i % 3];
            const zoneForCarrier = (carrier.operatingZoneIds as number[])[0];
            const vehicleForCarrier = vehiclesByCarrier[carrier.id][Math.floor(i / 3) % 5];
            const onShift = i < 6; // đảm bảo mỗi carrier (3) có ít nhất 2 shipper on_shift trong 3 người đầu mỗi nhóm
            return prisma.shipperProfile.create({
                data: {
                    userId: u.id,
                    carrierId: carrier.id,
                    licenseNumber: `A1-${100000 + i}`,
                    licenseClass: 'A1',
                    defaultZoneId: zoneForCarrier,
                    currentVehicleId: onShift ? vehicleForCarrier.id : null,
                    status: onShift ? 'on_shift' : 'off_duty',
                },
            });
        }),
    );

    // ==================== ROAD SEGMENTS & RESTRICTIONS ====================
    console.log('Creating road segments and restrictions...');
    const roadNames = ['Phạm Hùng', 'Láng Hạ', 'Kim Mã', 'Tràng Tiền', 'Nguyễn Trãi', 'Xuân Thủy'];
    const roads = await Promise.all(
        Array.from({ length: 6 }, (_, i) => {
            const lng0 = 105.78 + (i % 5) * 0.02;
            const lat0 = 21.0 + (i % 5) * 0.015;
            const geometry = JSON.stringify({
                type: 'LineString',
                coordinates: [
                    [lng0, lat0],
                    [lng0 + 0.004, lat0 + 0.003],
                    [lng0 + 0.008, lat0 + 0.001],
                ],
            });
            return prisma.roadSegment.create({
                data: {
                    zoneId: zones[i % zones.length].id,
                    name: `Đường ${roadNames[i]}`,
                    osmId: `way/${100000 + i}`,
                    geometry,
                    oneWay: i % 3 === 0,
                    speedLimit: 40,
                    lanes: 2 + (i % 3),
                    roadType: 'primary',
                },
            });
        }),
    );

    // Quy định UBND TP Hà Nội hiệu lực từ 15/1/2026 (giống nhau ở các file khảo sát Cầu Giấy,
    // Hoàn Kiếm, Đống Đa, Cửa Nam, Giảng Võ) — xe tải nhỏ cấm giờ cao điểm, xe tải lớn chỉ chạy đêm.
    await prisma.restriction.create({
        data: {
            zoneId: zonePeakHour.id,
            vehicleTypes: ['small_van', 'truck'],
            severity: 'restricted',
            maxWeight: 2000,
            timeFrom: '06:00',
            timeTo: '09:00',
            daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
            description: 'Xe tải <2 tấn hạn chế giờ cao điểm sáng (QĐ UBND TP Hà Nội, hiệu lực 15/1/2026)',
        },
    });
    await prisma.restriction.create({
        data: {
            zoneId: zonePeakHour.id,
            vehicleTypes: ['small_van', 'truck'],
            severity: 'restricted',
            maxWeight: 2000,
            timeFrom: '16:00',
            timeTo: '19:30',
            daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
            description: 'Xe tải <2 tấn hạn chế giờ cao điểm chiều (QĐ UBND TP Hà Nội, hiệu lực 15/1/2026)',
        },
    });
    await prisma.restriction.create({
        data: {
            zoneId: zonePeakHour.id,
            vehicleTypes: ['truck'],
            severity: 'prohibited',
            maxWeight: 2000,
            timeFrom: '06:00',
            timeTo: '21:00',
            daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            description: 'Xe tải ≥2 tấn chỉ được chạy 21:00–06:00; 2–10 tấn cần Công an TP chấp thuận văn bản, ≥10 tấn cần Sở Xây dựng chấp thuận văn bản',
        },
    });
    // LEZ Hoàn Kiếm — camera AI phạt tự động quanh Hồ Gươm, cấm xe tải >1 tấn 24/24
    await prisma.restriction.create({
        data: {
            zoneId: zoneLezHoanKiem.id,
            vehicleTypes: ['small_van', 'truck'],
            severity: 'prohibited',
            maxWeight: 1000,
            timeFrom: '00:00',
            timeTo: '23:59',
            daysOfWeek: [],
            description: 'LEZ quanh Hồ Gươm — cấm xe tải >1 tấn 24/24, camera AI phạt tự động, chỉ ưu tiên xe máy/xe đạp điện',
        },
    });
    // Phố cổ Hoàn Kiếm (Hàng Bạc/Hàng Gai) — phố hẹp 5-7m, cấm xe tải nặng, giao lẻ bằng xe máy
    await prisma.restriction.create({
        data: {
            zoneId: zoneHoanKiem.id,
            vehicleTypes: ['truck'],
            severity: 'prohibited',
            maxWeight: 1500,
            timeFrom: '06:00',
            timeTo: '21:00',
            daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            description: 'Phố lụa Hàng Gai hẹp 5-7m: xe tải >1,5 tấn cấm tuyệt đối 6h-21h, >2 tấn chỉ 21h-6h đêm từ ngõ Hàng Bồ; vi phạm phạt 3-5 triệu đồng',
        },
    });
    // Chợ Đồng Xuân — ngoại lệ B2B, xe tải trung được vào giờ chợ, cấm đêm ngoài khung
    await prisma.restriction.create({
        data: {
            zoneId: zoneHoanKiem.id,
            vehicleTypes: ['small_van'],
            severity: 'allowed_window',
            maxWeight: 3500,
            timeFrom: '10:00',
            timeTo: '16:00',
            daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            description: 'Chợ Đồng Xuân — xe tải ≤3,5 tấn được phép 10h-16h phục vụ chợ đầu mối; >3,5 tấn cấm 24/24',
        },
    });
    // Vài restriction theo road segment cụ thể
    for (let i = 0; i < 3; i++) {
        await prisma.restriction.create({
            data: {
                roadSegmentId: roads[i].id,
                vehicleType: 'small_van',
                vehicleTypes: ['small_van'],
                severity: 'restricted',
                maxWeight: 1000,
                timeFrom: '07:00',
                timeTo: '09:00',
                daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
                description: `Hạn chế xe tải nhỏ — ${roadNames[i]}`,
            },
        });
    }

    // ==================== ĐOẠN ĐƯỜNG + CẤM ĐƯỜNG THẬT THEO PHƯỜNG (trích khảo sát 6 khu vực) ====================
    console.log('Creating real named road segments and ward-level restrictions...');

    const roadHungVuong = await prisma.roadSegment.create({
        data: {
            zoneId: zoneBaDinh.id,
            name: 'Đường Hùng Vương',
            geometry: JSON.stringify({ type: 'LineString', coordinates: [[105.8375, 21.0375], [105.8394, 21.0355], [105.8402, 21.0335]] }),
            oneWay: false,
            speedLimit: 30,
            lanes: 4,
            roadType: 'primary',
        },
    });
    await prisma.restriction.create({
        data: {
            roadSegmentId: roadHungVuong.id,
            zoneId: zoneBaDinh.id,
            vehicleTypes: ['small_van', 'truck'],
            severity: 'prohibited',
            timeFrom: '00:00',
            timeTo: '23:59',
            daysOfWeek: [],
            description: 'Tuyến phố an ninh Hùng Vương (khu Lăng Bác/Quảng trường Ba Đình): cấm xe tải tuyệt đối và cấm dừng đỗ để phục vụ công tác bảo vệ mục tiêu',
        },
    });

    const roadLeHongPhong = await prisma.roadSegment.create({
        data: {
            zoneId: zoneBaDinh.id,
            name: 'Đường Lê Hồng Phong (một phần)',
            geometry: JSON.stringify({ type: 'LineString', coordinates: [[105.8368, 21.033], [105.8385, 21.0318], [105.8401, 21.0305]] }),
            oneWay: false,
            speedLimit: 30,
            lanes: 2,
            roadType: 'secondary',
        },
    });
    await prisma.restriction.create({
        data: {
            roadSegmentId: roadLeHongPhong.id,
            zoneId: zoneBaDinh.id,
            vehicleTypes: ['small_van', 'truck'],
            severity: 'prohibited',
            timeFrom: '00:00',
            timeTo: '23:59',
            daysOfWeek: [],
            description: 'Tuyến phố an ninh — thường xuyên có biển cấm xe tải tuyệt đối/cấm dừng đỗ phục vụ bảo vệ mục tiêu (khu vực cơ quan trung ương)',
        },
    });

    const roadHangMa = await prisma.roadSegment.create({
        data: {
            zoneId: zoneHoanKiem.id,
            name: 'Phố Hàng Mã',
            geometry: JSON.stringify({ type: 'LineString', coordinates: [[105.8489, 21.0368], [105.8496, 21.0358], [105.8502, 21.0349]] }),
            oneWay: true,
            speedLimit: 20,
            lanes: 1,
            roadType: 'tertiary',
        },
    });
    await prisma.restriction.create({
        data: {
            roadSegmentId: roadHangMa.id,
            zoneId: zoneHoanKiem.id,
            vehicleTypes: ['truck'],
            severity: 'prohibited',
            maxWeight: 1500,
            timeFrom: '06:00',
            timeTo: '21:00',
            daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            description: 'Phố Hàng Mã: xe tải >1,5 tấn cấm 6h-21h; mùa Trung Thu (15/8-15/9) nới ngoại lệ cho xe <2 tấn tới 22h; đèn lồng cồng kềnh phải tháo rời khi giao đêm',
        },
    });

    const roadLyThaiTo = await prisma.roadSegment.create({
        data: {
            zoneId: zoneLezHoanKiem.id,
            name: 'Đường Lý Thái Tổ',
            geometry: JSON.stringify({ type: 'LineString', coordinates: [[105.8524, 21.0287], [105.8531, 21.0279], [105.8538, 21.027]] }),
            oneWay: false,
            speedLimit: 20,
            lanes: 2,
            roadType: 'secondary',
        },
    });
    await prisma.restriction.create({
        data: {
            roadSegmentId: roadLyThaiTo.id,
            zoneId: zoneLezHoanKiem.id,
            vehicleTypes: ['truck'],
            severity: 'prohibited',
            maxWeight: 1000,
            timeFrom: '00:00',
            timeTo: '23:59',
            daysOfWeek: [],
            description: 'Đoạn tượng đài Lý Thái Tổ - Lò Sũ: xe tải >1 tấn cấm 24/24 (đặc khu du lịch), xe khách >16 chỗ cấm giờ cao điểm 6h-9h/15h-19h, cấm hoàn toàn cuối tuần; camera AI phạt tự động; giao nhận qua locker 36-38 Lý Thái Tổ',
        },
    });

    const roadPhungHungBatDan = await prisma.roadSegment.create({
        data: {
            zoneId: zoneHoanKiem.id,
            name: 'Đường Phùng Hưng - Bát Đàn (đoạn Điện Biên - Phúc Tân)',
            geometry: JSON.stringify({ type: 'LineString', coordinates: [[105.8452, 21.0361], [105.8467, 21.0373], [105.8481, 21.0384]] }),
            oneWay: false,
            speedLimit: 30,
            lanes: 2,
            roadType: 'secondary',
        },
    });
    await prisma.restriction.create({
        data: {
            roadSegmentId: roadPhungHungBatDan.id,
            zoneId: zoneHoanKiem.id,
            vehicleTypes: ['truck'],
            severity: 'restricted',
            maxWeight: 2500,
            timeFrom: '10:00',
            timeTo: '16:00',
            daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            description: 'Phùng Hưng - Bát Đàn (đoạn Điện Biên - Phúc Tân): xe tải >2,5 tấn cấm 6h-21h, xe <2,5 tấn chỉ được vào 10h-16h; ban đêm cho phép xe 5 tấn từ bãi ngầm Bát Đàn (2026)',
        },
    });

    const roadNguyenTruongTo = await prisma.roadSegment.create({
        data: {
            zoneId: zoneBaDinh.id,
            name: 'Đường Đội Cấn',
            geometry: JSON.stringify({ type: 'LineString', coordinates: [[105.8226, 21.0339], [105.8244, 21.0328], [105.8261, 21.0316]] }),
            oneWay: false,
            speedLimit: 35,
            lanes: 2,
            roadType: 'secondary',
        },
    });
    await prisma.restriction.create({
        data: {
            roadSegmentId: roadNguyenTruongTo.id,
            zoneId: zoneBaDinh.id,
            vehicleTypes: ['small_van', 'truck'],
            severity: 'restricted',
            maxWeight: 2000,
            timeFrom: '06:00',
            timeTo: '09:00',
            daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
            description: 'Đội Cấn: xe tải <2 tấn hạn chế giờ cao điểm, ≥2 tấn chỉ chạy 21h-6h (áp dụng quy định chung UBND TP từ 15/1/2026)',
        },
    });

    // ==================== FACILITIES (điểm tập kết/kho nhỏ per carrier + địa điểm thật từ khảo sát) ====================
    console.log('Creating facilities...');
    const facilities = await Promise.all([
        prisma.facility.create({ data: { organizationId: orgA.id, zoneId: zoneCauGiay.id, name: 'Điểm tập kết FastShip Cầu Giấy', kind: 'hub', latitude: 21.0285, longitude: 105.78, address: 'Số 18 Phạm Hùng, Cầu Giấy', capacity: 100 } }),
        prisma.facility.create({ data: { organizationId: orgB.id, zoneId: zoneDongDa.id, name: 'Điểm tập kết GreenBike Đống Đa', kind: 'hub', latitude: 21.015, longitude: 105.82, address: 'Số 99 Láng Hạ, Đống Đa', capacity: 80 } }),
        prisma.facility.create({ data: { organizationId: orgB.id, zoneId: zoneDongDa.id, name: 'Trạm sạc GreenBike Đống Đa', kind: 'charging_station', latitude: 21.016, longitude: 105.821, address: 'Số 101 Láng Hạ', capacity: 20 } }),
        prisma.facility.create({ data: { organizationId: orgC.id, zoneId: zoneHoanKiem.id, name: 'Điểm tập kết TrustGo Hoàn Kiếm', kind: 'mfc', latitude: 21.028, longitude: 105.85, address: 'Số 10 Tràng Tiền, Hoàn Kiếm', capacity: 60 } }),
        // Địa điểm thật trích từ khảo sát thực địa (bãi đỗ, trạm sạc, trạm xăng) — dùng chung, không gắn carrier cụ thể (organizationId = cơ quan quản lý)
        prisma.facility.create({ data: { organizationId: orgPlatform.id, zoneId: zoneCauGiay.id, name: 'Bãi đỗ xe 131 Nguyễn Phong Sắc', kind: 'hub', latitude: 21.0324, longitude: 105.7887, address: '131 Nguyễn Phong Sắc, Dịch Vọng, Cầu Giấy', capacity: 300, description: 'Bãi đỗ lớn phục vụ cả xe máy và ô tô' } }),
        prisma.facility.create({ data: { organizationId: orgPlatform.id, zoneId: zoneCauGiay.id, name: 'Trạm sạc VinFast Dịch Vọng', kind: 'charging_station', latitude: 21.0318, longitude: 105.7912, address: 'Dịch Vọng, Cầu Giấy', capacity: 10 } }),
        prisma.facility.create({ data: { organizationId: orgPlatform.id, zoneId: zoneCauGiay.id, name: 'Trạm sạc EV 133 Dịch Vọng Hậu', kind: 'charging_station', latitude: 21.033, longitude: 105.793, address: '133 đường Dịch Vọng, Cầu Giấy', capacity: 8 } }),
        prisma.facility.create({ data: { organizationId: orgPlatform.id, zoneId: zoneCauGiay.id, name: 'Trạm sạc EV Vinhomes Gardenia', kind: 'charging_station', latitude: 21.0362, longitude: 105.7756, address: 'Vinhomes Gardenia, Mỹ Đình', capacity: 12 } }),
        prisma.facility.create({ data: { organizationId: orgPlatform.id, zoneId: zoneHoanKiem.id, name: 'Bãi đỗ Lý Thường Kiệt - Hàng Bài', kind: 'hub', latitude: 21.0245, longitude: 105.8523, address: 'Lý Thường Kiệt - Hàng Bài, Hoàn Kiếm', capacity: 300, description: 'Bãi đỗ xe máy/ô tô qua đêm, cách Hàng Gai ~300m' } }),
        prisma.facility.create({ data: { organizationId: orgPlatform.id, zoneId: zoneHoanKiem.id, name: 'PVOil Lý Thường Kiệt', kind: 'fuel_station', latitude: 21.0247, longitude: 105.8518, address: 'Lý Thường Kiệt, Hoàn Kiếm (24/7)', capacity: null } }),
        prisma.facility.create({ data: { organizationId: orgPlatform.id, zoneId: zoneHoanKiem.id, name: 'Bãi ngầm Phùng Hưng - Bát Đàn', kind: 'hub', latitude: 21.0367, longitude: 105.8478, address: 'Phùng Hưng - Bát Đàn, Hoàn Kiếm', capacity: 378, description: 'Quy hoạch phê duyệt 12/2025 — tầng 1: 110 xe máy, tầng 2: 268 ô tô tự động' } }),
        prisma.facility.create({ data: { organizationId: orgPlatform.id, zoneId: zoneHoanKiem.id, name: 'Bãi xe chợ Đồng Xuân', kind: 'hub', latitude: 21.0378, longitude: 105.8494, address: 'Đặng Giảng - Phùng Hưng, chợ Đồng Xuân', capacity: 500, description: 'Do Công ty CP Đồng Xuân quản lý' } }),
        prisma.facility.create({ data: { organizationId: orgPlatform.id, zoneId: zoneCuaNam.id, name: 'Bãi đỗ hầm Tràng Tiền Plaza', kind: 'hub', latitude: 21.0242, longitude: 105.8571, address: 'Tràng Tiền Plaza, tầng hầm', capacity: 120, description: '100 xe máy + 20 ô tô' } }),
        prisma.facility.create({ data: { organizationId: orgPlatform.id, zoneId: zoneCuaNam.id, name: 'Trạm sạc VinFast Tràng Tiền Plaza', kind: 'charging_station', latitude: 21.0242, longitude: 105.8571, address: 'Tầng B1 Tràng Tiền Plaza, 18 Lê Duẩn', capacity: 6 } }),
        prisma.facility.create({ data: { organizationId: orgPlatform.id, zoneId: zoneCuaNam.id, name: 'Petrolimex 24 Tràng Tiền', kind: 'fuel_station', latitude: 21.0243, longitude: 105.8568, address: '24 Tràng Tiền, gần Nhà hát Lớn', capacity: null } }),
        prisma.facility.create({ data: { organizationId: orgPlatform.id, zoneId: zoneBaDinh.id, name: 'Bãi đỗ xe Lăng Bác', kind: 'hub', latitude: 21.0369, longitude: 105.8347, address: 'Khu vực Lăng Chủ tịch Hồ Chí Minh, Ba Đình', capacity: 200 } }),
        prisma.facility.create({ data: { organizationId: orgPlatform.id, zoneId: zoneBaDinh.id, name: 'Trạm sạc VinFast Liễu Giai', kind: 'charging_station', latitude: 21.0332, longitude: 105.8188, address: 'Liễu Giai, Ba Đình', capacity: 10 } }),
        prisma.facility.create({ data: { organizationId: orgPlatform.id, zoneId: zoneGiangVo.id, name: 'Bãi đỗ xe tư nhân 138B Giảng Võ', kind: 'hub', latitude: 21.0286, longitude: 105.8213, address: '138B Giảng Võ', capacity: 60 } }),
        prisma.facility.create({ data: { organizationId: orgPlatform.id, zoneId: zoneGiangVo.id, name: 'Trạm sạc Vincom Center Metropolis', kind: 'charging_station', latitude: 21.0347, longitude: 105.8145, address: 'Hầm B3, 29 Liễu Giai', capacity: 15 } }),
        prisma.facility.create({ data: { organizationId: orgPlatform.id, zoneId: zoneGiangVo.id, name: 'Petrolimex số 19 Ngọc Khánh', kind: 'fuel_station', latitude: 21.0296, longitude: 105.8152, address: '104 Ngọc Khánh, Ba Đình', capacity: null } }),
        // Nhập từ facilities.sql (template import cũ, đã chuyển sang schema Int id hiện tại) — giữ nguyên tên/toạ độ/kind/capacity gốc
        prisma.facility.create({ data: { organizationId: orgA.id, zoneId: zoneHoanKiem.id, name: 'Hub GHTK Hai Bà Trưng', kind: 'hub', latitude: 21.008, longitude: 105.85, address: 'Số 200 Bạch Mai', capacity: 400 } }),
        prisma.facility.create({ data: { organizationId: orgA.id, zoneId: zoneHoanKiem.id, name: 'Facility 11', kind: 'hub', latitude: 21.03119148, longitude: 105.8641246, capacity: 300 } }),
        prisma.facility.create({ data: { organizationId: orgA.id, zoneId: zoneHoanKiem.id, name: 'Facility 9', kind: 'charging_station', latitude: 21.05646183, longitude: 105.8895142, capacity: 200 } }),
        prisma.facility.create({ data: { organizationId: orgA.id, zoneId: zoneHoanKiem.id, name: 'Facility 17', kind: 'charging_station', latitude: 21.04950224, longitude: 105.8875366, capacity: 600 } }),
        prisma.facility.create({ data: { organizationId: orgC.id, zoneId: zoneHoanKiem.id, name: 'Facility 8', kind: 'warehouse', latitude: 21.07788537, longitude: 105.8775059, capacity: 150 } }),
        prisma.facility.create({ data: { organizationId: orgB.id, zoneId: zoneDongDa.id, name: 'Trạm sạc ABC Đống Đa', kind: 'charging_station', latitude: 21.015, longitude: 105.82, address: 'Số 99 Láng Hạ', capacity: 20 } }),
        prisma.facility.create({ data: { organizationId: orgPlatform.id, zoneId: zoneCauGiay.id, name: 'Facility 12', kind: 'warehouse', latitude: 21.06759431, longitude: 105.803173, capacity: 350 } }),
        prisma.facility.create({ data: { organizationId: orgPlatform.id, zoneId: zoneHoanKiem.id, name: 'Facility 10', kind: 'fuel_station', latitude: 21.08934725, longitude: 105.8664271, capacity: 250 } }),
        prisma.facility.create({ data: { organizationId: orgPlatform.id, zoneId: zoneHoanKiem.id, name: 'MFC Shopee Hoàn Kiếm', kind: 'mfc', latitude: 21.028, longitude: 105.85, address: 'Số 10 Tràng Tiền', capacity: 100 } }),
        prisma.facility.create({ data: { organizationId: orgB.id, zoneId: zoneBaDinh.id, name: 'Trạm xăng ABC Ba Đình', kind: 'fuel_station', latitude: 21.036, longitude: 105.81, address: 'Số 1 Kim Mã', capacity: 50 } }),
        prisma.facility.create({ data: { organizationId: orgC.id, zoneId: zoneThanhXuan.id, name: 'Kho GHN Thanh Xuân', kind: 'warehouse', latitude: 20.9933, longitude: 105.798, address: 'Số 5 Khuất Duy Tiến', capacity: 1000 } }),
        prisma.facility.create({ data: { organizationId: orgPlatform.id, zoneId: zoneHoanKiem.id, name: 'Facility 15', kind: 'hub', latitude: 21.02892649, longitude: 105.8800773, capacity: 500 } }),
        prisma.facility.create({ data: { organizationId: orgPlatform.id, zoneId: zoneHoanKiem.id, name: 'Facility 14', kind: 'fuel_station', latitude: 21.00721894, longitude: 105.8593208, capacity: 450 } }),
        prisma.facility.create({ data: { organizationId: orgPlatform.id, zoneId: zoneCauGiay.id, name: 'Facility 20', kind: 'warehouse', latitude: 21.09545678, longitude: 105.809042, capacity: 750 } }),
        prisma.facility.create({ data: { organizationId: orgPlatform.id, zoneId: zoneHoanKiem.id, name: 'Facility 7', kind: 'hub', latitude: 21.04589274, longitude: 105.8832527, capacity: 100 } }),
        prisma.facility.create({ data: { organizationId: orgPlatform.id, zoneId: zoneCauGiay.id, name: 'Facility 19', kind: 'hub', latitude: 21.08420438, longitude: 105.8317094, capacity: 700 } }),
        prisma.facility.create({ data: { organizationId: orgA.id, zoneId: zoneCauGiay.id, name: 'Hub GHN Cầu Giấy', kind: 'hub', latitude: 21.0285, longitude: 105.78, address: 'Số 18 Phạm Hùng, Cầu Giấy', capacity: 500 } }),
        prisma.facility.create({ data: { organizationId: orgPlatform.id, zoneId: zoneCauGiay.id, name: 'Facility 16', kind: 'warehouse', latitude: 21.07182273, longitude: 105.8919977, capacity: 550 } }),
        prisma.facility.create({ data: { organizationId: orgPlatform.id, zoneId: zoneBaDinh.id, name: 'Facility 13', kind: 'charging_station', latitude: 21.09763136, longitude: 105.8460287, capacity: 400 } }),
        prisma.facility.create({ data: { organizationId: orgPlatform.id, zoneId: zoneCauGiay.id, name: 'Facility 18', kind: 'fuel_station', latitude: 21.06653795, longitude: 105.8898169, capacity: 650 } }),
        prisma.facility.create({ data: { organizationId: orgA.id, zoneId: zoneCauGiay.id, name: 'Hub Viettel Post — Phạm Hùng', kind: 'hub', latitude: 21.0285, longitude: 105.78, address: 'Số 18 Phạm Hùng, Cầu Giấy, Hà Nội', capacity: 500, openingTime: '07:00', closingTime: '22:00', description: 'Hub trung tâm Viettel Post khu vực Cầu Giấy' } }),
    ]);

    for (let i = 0; i < 4; i++) {
        await prisma.charger.create({ data: { facilityId: facilities[2].id, type: i % 2 === 0 ? 'DC' : 'AC', connectorType: 'CCS', powerKw: i % 2 === 0 ? 60 : 11, slots: 2 } });
    }
    for (const f of [facilities[0], facilities[1], facilities[3]]) {
        for (let i = 0; i < 2; i++) {
            await prisma.dock.create({ data: { facilityId: f.id, name: `Dock ${i + 1}`, capacity: 4 } });
        }
    }

    // ==================== ORDERS (theo zone, per carrier) ====================
    console.log('Creating orders...');
    const orderStatuses = ['pending', 'pending', 'assigned', 'delivered', 'failed'];
    const orders: Awaited<ReturnType<typeof prisma.order.create>>[] = [];
    let orderSeq = 1;
    for (const carrier of carriers) {
        const carrierZoneIds = carrier.operatingZoneIds as number[];
        for (let i = 0; i < 6; i++) {
            const zoneId = carrierZoneIds[i % carrierZoneIds.length];
            const base = { lat: 21.0 + (zoneId % 5) * 0.01, lon: 105.8 + (zoneId % 5) * 0.01 };
            const order = await prisma.order.create({
                data: {
                    carrierId: carrier.id,
                    customerId: customerUsers[(orderSeq - 1) % customerUsers.length].id,
                    zoneId,
                    orderNumber: `ORD-2026-${String(orderSeq).padStart(5, '0')}`,
                    trackingNo: `TRK${Date.now()}${uuid().slice(0, 6).toUpperCase()}`,
                    status: orderStatuses[i % orderStatuses.length],
                    pickupAddress: `Số ${10 + i} phố gần khu vực zone ${zoneId}, Hà Nội`,
                    pickupLat: base.lat + Math.random() * 0.01,
                    pickupLon: base.lon + Math.random() * 0.01,
                    pickupPhone: `090400${String(orderSeq).padStart(4, '0')}`,
                    deliveryAddress: `Số ${100 + i} đường gần khu vực zone ${zoneId}, Hà Nội`,
                    deliveryLat: base.lat + Math.random() * 0.015,
                    deliveryLon: base.lon + Math.random() * 0.015,
                    deliveryPhone: `090500${String(orderSeq).padStart(4, '0')}`,
                    weightKg: 0.5 + i * 0.3,
                    itemCount: 1 + (i % 3),
                    codAmount: i % 2 === 0 ? 150000 + i * 20000 : 0,
                    priority: 1 + (i % 5),
                    notes: i % 3 === 0 ? 'Giao giờ hành chính' : null,
                },
            });
            orders.push(order);
            orderSeq++;
        }
    }

    // ==================== ROUTES (chuyến giao — planned/in_progress/completed mẫu) ====================
    console.log('Creating routes with stops (POD/COD mẫu)...');
    const now = new Date();
    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

    async function makeRoute(
        carrier: typeof carrierA,
        shipperProfile: (typeof shipperProfiles)[number],
        vehicleId: number,
        zoneId: number,
        orderPool: typeof orders,
        status: 'planned' | 'in_progress' | 'completed',
    ) {
        const carrierOrders = orderPool.filter((o) => o.carrierId === carrier.id && o.status !== 'delivered' && o.status !== 'failed').slice(0, 2);
        if (!carrierOrders.length) return null;

        const code = `RT-${today.toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
        const route = await prisma.route.create({
            data: {
                carrierId: carrier.id,
                vehicleId,
                shipperId: shipperProfile.userId,
                zoneId,
                code,
                shiftDate: today,
                status,
                plannedStartAt: new Date(today.getTime() + 8 * 3600 * 1000),
                actualStartAt: status !== 'planned' ? new Date(today.getTime() + 8 * 3600 * 1000) : undefined,
                actualEndAt: status === 'completed' ? new Date(today.getTime() + 11 * 3600 * 1000) : undefined,
                totalDistanceKm: 6 + carrierOrders.length * 2,
                totalDurationMin: 30 + carrierOrders.length * 10,
            },
        });

        let seq = 1;
        for (const order of carrierOrders) {
            const stopStatus = status === 'completed' ? 'completed' : status === 'in_progress' ? (seq === 1 ? 'completed' : 'pending') : 'pending';
            if (order.pickupLat != null && order.pickupLon != null) {
                await prisma.stop.create({
                    data: {
                        routeId: route.id,
                        orderId: order.id,
                        sequence: seq++,
                        type: 'pickup',
                        latitude: order.pickupLat,
                        longitude: order.pickupLon,
                        address: order.pickupAddress ?? undefined,
                        contactPhone: order.pickupPhone,
                        status: stopStatus,
                        arrivedAt: stopStatus !== 'pending' ? new Date() : undefined,
                        completedAt: stopStatus === 'completed' ? new Date() : undefined,
                    },
                });
            }
            if (order.deliveryLat != null && order.deliveryLon != null) {
                const deliveryStopStatus = status === 'completed' ? 'completed' : 'pending';
                await prisma.stop.create({
                    data: {
                        routeId: route.id,
                        orderId: order.id,
                        sequence: seq++,
                        type: 'delivery',
                        latitude: order.deliveryLat,
                        longitude: order.deliveryLon,
                        address: order.deliveryAddress ?? undefined,
                        contactPhone: order.deliveryPhone,
                        status: deliveryStopStatus,
                        arrivedAt: deliveryStopStatus === 'completed' ? new Date() : undefined,
                        completedAt: deliveryStopStatus === 'completed' ? new Date() : undefined,
                        codAmountDue: order.codAmount ?? 0,
                        codAmountCollected: deliveryStopStatus === 'completed' ? (order.codAmount ?? 0) : 0,
                        codCollected: deliveryStopStatus === 'completed' && (order.codAmount ?? 0) > 0,
                        codCollectedAt: deliveryStopStatus === 'completed' && (order.codAmount ?? 0) > 0 ? new Date() : undefined,
                        podPhotoUrl: deliveryStopStatus === 'completed' ? 'https://picsum.photos/seed/pod/400/300' : undefined,
                        podNote: deliveryStopStatus === 'completed' ? 'Đã giao, khách nhận trực tiếp' : undefined,
                    },
                });
            }
            await prisma.order.update({
                where: { id: order.id },
                data: { status: status === 'completed' ? 'delivered' : 'assigned' },
            });
        }

        return route;
    }

    const onShiftProfiles = shipperProfiles.filter((s) => s.status === 'on_shift');
    await makeRoute(carrierA, onShiftProfiles.find((s) => s.carrierId === carrierA.id)!, vehiclesByCarrier[carrierA.id][0].id, zoneCauGiay.id, orders, 'planned');
    await makeRoute(carrierB, onShiftProfiles.find((s) => s.carrierId === carrierB.id)!, vehiclesByCarrier[carrierB.id][0].id, zoneDongDa.id, orders, 'in_progress');
    await makeRoute(carrierC, onShiftProfiles.find((s) => s.carrierId === carrierC.id)!, vehiclesByCarrier[carrierC.id][0].id, zoneHoanKiem.id, orders, 'completed');

    // ==================== TELEMETRY ====================
    console.log('Creating telemetry...');
    for (const carrier of carriers) {
        for (const vehicle of vehiclesByCarrier[carrier.id].slice(0, 3)) {
            for (let i = 0; i < 5; i++) {
                await prisma.telemetry.create({
                    data: {
                        vehicleId: vehicle.id,
                        timestamp: new Date(Date.now() - i * 60000),
                        latitude: 21.02 + Math.random() * 0.02,
                        longitude: 105.82 + Math.random() * 0.02,
                        speed: 15 + Math.random() * 25,
                        heading: Math.random() * 360,
                        batteryLevel: vehicle.isElectric ? 50 + Math.random() * 50 : null,
                        fuelLevel: !vehicle.isElectric ? 30 + Math.random() * 70 : null,
                        engineStatus: 'running',
                        odometer: 5000 + Math.random() * 20000,
                    },
                });
            }
        }
    }

    console.log('✅ Seed completed!');
    console.log(`
📊 Data created:
- Carriers (last-mile nội đô): 3 (FastShip Cầu Giấy, GreenBike Đống Đa, TrustGo Hoàn Kiếm)
- Zones: 9 (5 quận + LEZ Hoàn Kiếm + khu cấm giờ cao điểm + phường Cửa Nam + phường Giảng Võ)
- Vehicles: 18 (6/carrier, xe máy/e-bike/xe tải nhỏ)
- Shippers: 9 (3/carrier)
- Orders: ${orders.length}
- Routes mẫu: 3 (planned / in_progress / completed với POD/COD)

🔐 Test accounts (password: 123456):
- admin@platform.vn (Admin nền tảng)
- regulator@hanoi.gov.vn (Regulator)
- ops@fastship-cg.vn / ops@greenbike.vn / ops@trustgo.vn (Carrier-Ops)
- shipper1@lastmile.vn ... shipper9@lastmile.vn (Shipper)
- customer1@gmail.com ... customer8@gmail.com (Consumer)
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
