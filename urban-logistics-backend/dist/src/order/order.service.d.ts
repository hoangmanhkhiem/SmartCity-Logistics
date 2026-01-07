import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto, UpdateOrderDto } from './dto';
export declare class OrderService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateOrderDto): Promise<{
        customer: {
            id: string;
            email: string;
            password: string;
            name: string;
            phone: string | null;
            avatarUrl: string | null;
            isActive: boolean;
            lastLoginAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
        };
        shipments: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            volume: number | null;
            status: string;
            orderId: string;
            trackingNo: string;
            weight: number | null;
            width: number | null;
            height: number | null;
            length: number | null;
            itemCount: number | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        orderNumber: string;
        pickupAddress: string | null;
        pickupLat: number | null;
        pickupLon: number | null;
        deliveryAddress: string | null;
        deliveryLat: number | null;
        deliveryLon: number | null;
        timeWindowStart: Date | null;
        timeWindowEnd: Date | null;
        priority: number;
        notes: string | null;
        customerId: string | null;
    }>;
    findAll(page?: number, limit?: number, status?: string, customerId?: string): Promise<{
        data: ({
            _count: {
                shipments: number;
            };
            customer: {
                id: string;
                email: string;
                password: string;
                name: string;
                phone: string | null;
                avatarUrl: string | null;
                isActive: boolean;
                lastLoginAt: Date | null;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            orderNumber: string;
            pickupAddress: string | null;
            pickupLat: number | null;
            pickupLon: number | null;
            deliveryAddress: string | null;
            deliveryLat: number | null;
            deliveryLon: number | null;
            timeWindowStart: Date | null;
            timeWindowEnd: Date | null;
            priority: number;
            notes: string | null;
            customerId: string | null;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(id: string): Promise<{
        customer: {
            id: string;
            email: string;
            password: string;
            name: string;
            phone: string | null;
            avatarUrl: string | null;
            isActive: boolean;
            lastLoginAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
        };
        shipments: ({
            legs: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                status: string;
                shipmentId: string;
                routeId: string;
                sequence: number;
                distance: number | null;
                duration: number | null;
                startedAt: Date | null;
                endedAt: Date | null;
            }[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            volume: number | null;
            status: string;
            orderId: string;
            trackingNo: string;
            weight: number | null;
            width: number | null;
            height: number | null;
            length: number | null;
            itemCount: number | null;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        orderNumber: string;
        pickupAddress: string | null;
        pickupLat: number | null;
        pickupLon: number | null;
        deliveryAddress: string | null;
        deliveryLat: number | null;
        deliveryLon: number | null;
        timeWindowStart: Date | null;
        timeWindowEnd: Date | null;
        priority: number;
        notes: string | null;
        customerId: string | null;
    }>;
    update(id: string, dto: UpdateOrderDto): Promise<{
        customer: {
            id: string;
            email: string;
            password: string;
            name: string;
            phone: string | null;
            avatarUrl: string | null;
            isActive: boolean;
            lastLoginAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        orderNumber: string;
        pickupAddress: string | null;
        pickupLat: number | null;
        pickupLon: number | null;
        deliveryAddress: string | null;
        deliveryLat: number | null;
        deliveryLon: number | null;
        timeWindowStart: Date | null;
        timeWindowEnd: Date | null;
        priority: number;
        notes: string | null;
        customerId: string | null;
    }>;
    remove(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        orderNumber: string;
        pickupAddress: string | null;
        pickupLat: number | null;
        pickupLon: number | null;
        deliveryAddress: string | null;
        deliveryLat: number | null;
        deliveryLon: number | null;
        timeWindowStart: Date | null;
        timeWindowEnd: Date | null;
        priority: number;
        notes: string | null;
        customerId: string | null;
    }>;
}
