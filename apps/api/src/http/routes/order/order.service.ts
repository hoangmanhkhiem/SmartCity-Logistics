import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, Stop } from '../../../db/entities';
import { ZoneService } from '../zone/zone.service';
import { CreateOrderDto, UpdateOrderDto } from './dto';
import { v4 as uuid } from 'uuid';

const ORDER_STATUS_TRANSITIONS: Record<string, string[]> = {
    pending: ['assigned', 'cancelled'],
    assigned: ['in_transit', 'cancelled'],
    in_transit: ['delivered', 'failed'],
    delivered: [],
    failed: ['assigned'],
    cancelled: [],
};

@Injectable()
export class OrderService {
    constructor(
        @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
        @InjectRepository(Stop) private readonly stopRepo: Repository<Stop>,
        private readonly zoneService: ZoneService,
    ) {}

    async create(dto: CreateOrderDto) {
        const orderNumber = `ORD-${Date.now()}-${uuid().slice(0, 4).toUpperCase()}`;
        const trackingNo = `TRK${Date.now()}${uuid().slice(0, 6).toUpperCase()}`;

        let zoneId = dto.zoneId;
        if (!zoneId && dto.deliveryLat != null && dto.deliveryLon != null) {
            zoneId = (await this.zoneService.findZoneIdForPoint(dto.deliveryLat, dto.deliveryLon)) ?? undefined;
        }

        const saved = await this.orderRepo.save(
            this.orderRepo.create({ ...dto, zoneId, orderNumber, trackingNo, status: 'pending' }),
        );
        return this.orderRepo.findOne({
            where: { id: saved.id },
            relations: ['customer', 'zone', 'carrier'],
        });
    }

    async findAll(page = 1, limit = 10, status?: string, customerId?: string, carrierId?: string, zoneId?: string) {
        const pageNum = Number(page) || 1;
        const limitNum = Number(limit) || 10;
        const skip = (pageNum - 1) * limitNum;
        const where = {
            ...(status && { status }),
            ...(customerId && { customerId: Number(customerId) }),
            ...(carrierId && { carrierId: Number(carrierId) }),
            ...(zoneId && { zoneId: Number(zoneId) }),
        };
        const [rows, total] = await Promise.all([
            this.orderRepo.find({
                where,
                skip,
                take: limitNum,
                relations: ['customer', 'zone'],
                order: { createdAt: 'DESC' },
            }),
            this.orderRepo.count({ where }),
        ]);
        const data = await Promise.all(
            rows.map(async (o) => ({
                ...o,
                _count: { stops: await this.stopRepo.count({ where: { orderId: o.id } }) },
            })),
        );
        return { data, meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) } };
    }

    async findOne(id: number) {
        const o = await this.orderRepo.findOne({
            where: { id },
            relations: ['customer', 'zone', 'stops', 'stops.route'],
        });
        if (!o) throw new NotFoundException(`Order ${id} not found`);
        return o;
    }

    async update(id: number, dto: UpdateOrderDto) {
        const existing = await this.findOne(id);
        if (dto.status && dto.status !== existing.status) {
            const allowed = ORDER_STATUS_TRANSITIONS[existing.status] ?? [];
            if (!allowed.includes(dto.status)) {
                throw new BadRequestException(`Không thể chuyển đơn từ "${existing.status}" sang "${dto.status}"`);
            }
        }
        await this.orderRepo.update(id, dto);
        return this.orderRepo.findOne({ where: { id }, relations: ['customer'] });
    }

    async remove(id: number) {
        const existing = await this.findOne(id);
        if (['in_transit', 'delivered'].includes(existing.status)) {
            throw new BadRequestException('Không thể xóa đơn đang giao hoặc đã giao thành công');
        }
        return this.orderRepo.remove(await this.orderRepo.findOneByOrFail({ id }));
    }
}
