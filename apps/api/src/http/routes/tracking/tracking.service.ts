import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Order } from '../../../db/entities';

const orderRelations = [
    'stops',
    'stops.route',
    'stops.route.vehicle',
    'stops.route.shipper',
] as const;

@Injectable()
export class TrackingService {
    constructor(@InjectRepository(Order) private readonly orderRepo: Repository<Order>) {}

    private sortStops<T extends { stops?: Array<{ sequence: number }> }>(order: T): T {
        if (order.stops) {
            order.stops.sort((a, b) => a.sequence - b.sequence);
        }
        return order;
    }

    private trimShipperVehicle<T extends Order>(order: T): T {
        for (const stop of order.stops ?? []) {
            const route = stop.route;
            if (!route) continue;
            if (route.vehicle) {
                route.vehicle = {
                    id: route.vehicle.id,
                    plate: route.vehicle.plate,
                    type: route.vehicle.type,
                } as typeof route.vehicle;
            }
            if (route.shipper) {
                route.shipper = {
                    id: route.shipper.id,
                    name: route.shipper.name,
                    phone: route.shipper.phone,
                } as typeof route.shipper;
            }
        }
        return order;
    }

    async loadOrderDetail(where: object) {
        const order = await this.orderRepo.findOne({
            where,
            relations: [...orderRelations],
        });
        if (!order) return null;
        return this.trimShipperVehicle(this.sortStops(order));
    }

    async getByTrackingNo(trackingNo: string) {
        const order = await this.loadOrderDetail({ trackingNo });
        if (!order) throw new NotFoundException('Không tìm thấy mã vận đơn');
        return order;
    }

    async search(raw?: string) {
        const q = raw?.trim();
        if (!q) {
            throw new BadRequestException('Thiếu tham số q (mã vận đơn, mã đơn hoặc SĐT)');
        }

        const byTracking = await this.loadOrderDetail({ trackingNo: q });
        if (byTracking) {
            return { matchType: 'trackingNo' as const, order: byTracking };
        }

        const byOrderNumber = await this.orderRepo.find({
            where: { orderNumber: q },
            relations: [...orderRelations],
            order: { createdAt: 'DESC' },
            take: 15,
        });
        const orders = byOrderNumber.map((o) => this.trimShipperVehicle(this.sortStops(o)));
        if (orders.length === 1) {
            return { matchType: 'orderNumber' as const, order: orders[0] };
        }
        if (orders.length > 1) {
            return { matchType: 'orderNumber' as const, multiple: true as const, orders };
        }

        const digits = q.replace(/\D/g, '');
        if (digits.length >= 9) {
            const tail = digits.slice(-9);
            const byPhone = await this.orderRepo.find({
                where: [{ deliveryPhone: Like(`%${tail}%`) }, { pickupPhone: Like(`%${tail}%`) }],
                relations: [...orderRelations],
                order: { createdAt: 'DESC' },
                take: 15,
            });
            const phoneOrders = byPhone.map((o) => this.trimShipperVehicle(this.sortStops(o)));
            if (phoneOrders.length === 1) {
                return { matchType: 'phone' as const, order: phoneOrders[0] };
            }
            if (phoneOrders.length > 1) {
                return { matchType: 'phone' as const, multiple: true as const, orders: phoneOrders };
            }
        }

        throw new NotFoundException('Không tìm thấy vận đơn hoặc đơn hàng phù hợp');
    }
}
