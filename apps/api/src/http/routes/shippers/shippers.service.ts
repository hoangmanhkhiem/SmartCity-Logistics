import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { And, DataSource, In, LessThan, MoreThanOrEqual, Repository } from 'typeorm';
import { Order, Route, ShipperProfile, Stop, Telemetry, Vehicle } from '../../../db/entities';
import { RouteService } from '../route/route.service';
import { calculateRouteCo2Grams } from '../../middlewares/utils/co2';
import { ClockInDto, CompleteStopDto, CreateShipperProfileDto, FailStopDto } from './dto/shipper.dto';

@Injectable()
export class ShippersService {
    constructor(
        @InjectRepository(ShipperProfile) private readonly shipperProfileRepo: Repository<ShipperProfile>,
        @InjectRepository(Route) private readonly routeRepo: Repository<Route>,
        @InjectRepository(Vehicle) private readonly vehicleRepo: Repository<Vehicle>,
        @InjectRepository(Stop) private readonly stopRepo: Repository<Stop>,
        @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
        @InjectRepository(Telemetry) private readonly telemetryRepo: Repository<Telemetry>,
        private readonly dataSource: DataSource,
        private readonly routeService: RouteService,
    ) {}

    async listShippers(carrierId?: number) {
        const shippers = await this.shipperProfileRepo.find({
            where: { ...(carrierId && { carrierId }) },
            relations: ['user', 'currentVehicle', 'defaultZone'],
            order: { createdAt: 'DESC' },
        });
        const ids = shippers.map((s) => s.userId);
        const countRows = ids.length
            ? await this.routeRepo
                  .createQueryBuilder('r')
                  .select('r.shipper_id', 'shipperId')
                  .addSelect('COUNT(*)', 'cnt')
                  .where('r.shipper_id IN (:...ids)', { ids })
                  .groupBy('r.shipper_id')
                  .getRawMany<{ shipperId: number; cnt: string }>()
            : [];
        const countByShipper = Object.fromEntries(countRows.map((c) => [Number(c.shipperId), Number(c.cnt)]));
        return shippers.map((s) => ({
            ...s,
            user: s.user
                ? {
                      id: s.user.id,
                      name: s.user.name,
                      email: s.user.email,
                      phone: s.user.phone,
                      isActive: s.user.isActive,
                  }
                : undefined,
            currentVehicle: s.currentVehicle
                ? { id: s.currentVehicle.id, plate: s.currentVehicle.plate, type: s.currentVehicle.type }
                : undefined,
            defaultZone: s.defaultZone ? { id: s.defaultZone.id, name: s.defaultZone.name } : undefined,
            routesTotal: countByShipper[s.userId] ?? 0,
        }));
    }

    async createProfile(dto: CreateShipperProfileDto) {
        const saved = await this.shipperProfileRepo.save(this.shipperProfileRepo.create(dto));
        return this.shipperProfileRepo.findOne({
            where: { id: saved.id },
            relations: ['user', 'carrier'],
        });
    }

    async shipperStats(userId: number) {
        const profile = await this.shipperProfileRepo.findOne({
            where: { userId },
            relations: ['user'],
        });
        if (!profile) throw new NotFoundException('Shipper not found');

        const byStatus = await this.routeRepo
            .createQueryBuilder('r')
            .select('r.status', 'status')
            .addSelect('COUNT(*)', 'cnt')
            .where('r.shipper_id = :userId', { userId })
            .groupBy('r.status')
            .getRawMany<{ status: string; cnt: string }>();

        const recentRows = await this.routeRepo.find({
            where: { shipperId: userId },
            order: { shiftDate: 'DESC' },
            take: 10,
            relations: ['vehicle'],
        });
        const recent = await Promise.all(
            recentRows.map(async (r) => ({
                ...r,
                vehicle: r.vehicle ? { plate: r.vehicle.plate, type: r.vehicle.type } : undefined,
                _count: { stops: await this.stopRepo.count({ where: { routeId: r.id } }) },
            })),
        );

        return {
            shipper: { id: profile.user.id, name: profile.user.name, email: profile.user.email, phone: profile.user.phone },
            routesByStatus: Object.fromEntries(byStatus.map((b) => [b.status, Number(b.cnt)])),
            recentRoutes: recent,
        };
    }

    async clockIn(userId: number, dto: ClockInDto) {
        const profile = await this.shipperProfileRepo.findOneBy({ userId });
        if (!profile) throw new NotFoundException('Shipper profile not found');
        const vehicle = await this.vehicleRepo.findOneBy({ id: dto.vehicleId });
        if (!vehicle || vehicle.carrierId !== profile.carrierId) {
            throw new BadRequestException('Vehicle không thuộc carrier của shipper');
        }
        await this.shipperProfileRepo.update({ userId }, { status: 'on_shift', currentVehicleId: dto.vehicleId });
        return this.shipperProfileRepo.findOneBy({ userId });
    }

    async clockOut(userId: number) {
        const profile = await this.shipperProfileRepo.findOneBy({ userId });
        if (!profile) throw new NotFoundException('Shipper profile not found');
        await this.shipperProfileRepo.update({ userId }, { status: 'off_duty', currentVehicleId: null });
        return this.shipperProfileRepo.findOneBy({ userId });
    }

    // ==================== Self-service (shipper hiện tại) ====================

    async getTodayRoute(shipperId: number) {
        const now = new Date();
        const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
        const tomorrow = new Date(today);
        tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

        const route = await this.routeRepo.findOne({
            where: {
                shipperId,
                shiftDate: And(MoreThanOrEqual(today), LessThan(tomorrow)),
                status: In(['planned', 'in_progress']),
            },
            relations: ['vehicle', 'stops', 'stops.order'],
            order: { createdAt: 'DESC' },
        });
        if (route?.stops) route.stops.sort((a, b) => a.sequence - b.sequence);
        return route;
    }

    async getRouteForShipper(shipperId: number, routeId: number) {
        const route = await this.routeRepo.findOne({
            where: { id: routeId },
            relations: ['vehicle', 'stops', 'stops.order'],
        });
        if (!route || route.shipperId !== shipperId) throw new NotFoundException('Route not found');
        route.stops.sort((a, b) => a.sequence - b.sequence);
        return route;
    }

    async startRoute(shipperId: number, routeId: number) {
        const route = await this.routeRepo.findOneBy({ id: routeId });
        if (!route || route.shipperId !== shipperId) throw new NotFoundException('Route not found');
        if (route.status !== 'planned') throw new BadRequestException('Route đã bắt đầu hoặc đã kết thúc');
        await this.routeRepo.update(routeId, { status: 'in_progress', actualStartAt: new Date() });
        return this.routeRepo.findOneBy({ id: routeId });
    }

    async completeRoute(shipperId: number, routeId: number) {
        const route = await this.routeRepo.findOne({
            where: { id: routeId },
            relations: ['stops', 'stops.order', 'vehicle'],
        });
        if (!route || route.shipperId !== shipperId) throw new NotFoundException('Route not found');
        const unfinished = route.stops.some((s) => !['completed', 'failed', 'skipped'].includes(s.status));
        if (unfinished) throw new BadRequestException('Còn stop chưa xử lý xong');

        const totalWeightKg = route.stops
            .filter((s) => s.type === 'pickup')
            .reduce((sum, s) => sum + (s.order.weightKg ?? 0), 0);

        const estimatedCo2Grams = calculateRouteCo2Grams({
            distanceKm: route.totalDistanceKm ?? 0,
            vehicleType: route.vehicle.type,
            isElectric: route.vehicle.isElectric,
            emissionFactor: route.vehicle.emissionFactor,
            totalWeightKg,
            vehicleCapacityKg: route.vehicle.capacity,
        });

        await this.routeRepo.update(routeId, {
            status: 'completed',
            actualEndAt: new Date(),
            estimatedCo2Grams,
        });
        return this.routeRepo.findOneBy({ id: routeId });
    }

    private async findOwnedStop(shipperId: number, stopId: number) {
        const stop = await this.stopRepo.findOne({
            where: { id: stopId },
            relations: ['route', 'route.stops', 'order'],
        });
        if (!stop || stop.route.shipperId !== shipperId) throw new NotFoundException('Stop not found');
        return stop;
    }

    /** Chặn xử lý điểm dừng khi điểm dừng trước đó (sequence nhỏ hơn) trong cùng route chưa xong. */
    private assertPriorStopsResolved(stop: { sequence: number; route: { stops: { sequence: number; status: string }[] } }) {
        const blocking = stop.route.stops.some(
            (s) => s.sequence < stop.sequence && !['completed', 'failed', 'skipped'].includes(s.status),
        );
        if (blocking) {
            throw new BadRequestException('Còn điểm dừng trước đó chưa xử lý xong — phải xử lý theo thứ tự');
        }
    }

    async arriveStop(shipperId: number, stopId: number) {
        const stop = await this.findOwnedStop(shipperId, stopId);
        this.assertPriorStopsResolved(stop);
        await this.stopRepo.update(stopId, { status: 'arrived', arrivedAt: new Date() });
        return this.stopRepo.findOneBy({ id: stopId });
    }

    async completeStop(shipperId: number, stopId: number, dto: CompleteStopDto) {
        const stop = await this.findOwnedStop(shipperId, stopId);
        this.assertPriorStopsResolved(stop);

        return this.dataSource.transaction(async (manager) => {
            await manager.update(Stop, stopId, {
                status: 'completed',
                completedAt: new Date(),
                podPhotoUrl: dto.podPhotoUrl,
                podSignatureUrl: dto.podSignatureUrl,
                podNote: dto.podNote,
                ...(dto.codAmountCollected != null
                    ? {
                          codAmountCollected: dto.codAmountCollected,
                          codCollected: dto.codAmountCollected >= (stop.codAmountDue ?? 0),
                          codCollectedAt: new Date(),
                      }
                    : {}),
            });
            if (stop.type === 'delivery') {
                await manager.update(Order, stop.orderId, { status: 'delivered' });
            }
            return manager.findOneBy(Stop, { id: stopId });
        });
    }

    async failStop(shipperId: number, stopId: number, dto: FailStopDto) {
        const stop = await this.findOwnedStop(shipperId, stopId);
        this.assertPriorStopsResolved(stop);

        return this.dataSource.transaction(async (manager) => {
            await manager.update(Stop, stopId, {
                status: 'failed',
                failedReason: dto.failedReason,
                podNote: dto.note,
            });
            if (stop.type === 'delivery') {
                await manager.update(Order, stop.orderId, { status: 'failed' });
            }
            return manager.findOneBy(Stop, { id: stopId });
        });
    }

    /** Chỉ đường (né đoạn cấm) từ vị trí hiện tại của xe tới điểm dừng kế tiếp chưa xử lý. */
    async getDirectionsToNextStop(shipperId: number, routeId: number) {
        const route = await this.routeRepo.findOne({
            where: { id: routeId },
            relations: ['stops', 'vehicle'],
        });
        if (!route || route.shipperId !== shipperId) throw new NotFoundException('Route not found');
        route.stops.sort((a, b) => a.sequence - b.sequence);

        const nextStop = route.stops.find((s) => s.status === 'pending' || s.status === 'arrived');
        if (!nextStop) throw new BadRequestException('Không còn điểm dừng nào cần xử lý trong route này');

        const latestTelemetry = await this.telemetryRepo.findOne({
            where: { vehicleId: route.vehicleId },
            order: { timestamp: 'DESC' },
        });

        let originLat: number;
        let originLon: number;
        if (latestTelemetry) {
            originLat = latestTelemetry.latitude;
            originLon = latestTelemetry.longitude;
        } else {
            const prevIdx = route.stops.findIndex((s) => s.id === nextStop.id) - 1;
            const prevStop = prevIdx >= 0 ? route.stops[prevIdx] : null;
            originLat = prevStop?.latitude ?? nextStop.latitude;
            originLon = prevStop?.longitude ?? nextStop.longitude;
        }

        const directions = await this.routeService.drivingSegmentAvoidingRestrictions({
            originLat,
            originLon,
            destLat: nextStop.latitude,
            destLon: nextStop.longitude,
            restrictionVehicleType: route.vehicle.type,
        });

        return { ...directions, nextStop };
    }
}
