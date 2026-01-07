import { PrismaService } from '../prisma/prisma.service';
import { CreateZoneDto, UpdateZoneDto } from './dto';
export declare class ZoneService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateZoneDto): Promise<{
        id: string;
        name: string;
        type: string | null;
        description: string | null;
        boundary: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAll(page?: number, limit?: number, type?: string): Promise<{
        data: ({
            _count: {
                facilities: number;
                roadSegments: number;
                restrictions: number;
            };
        } & {
            id: string;
            name: string;
            type: string | null;
            description: string | null;
            boundary: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(id: string): Promise<{
        facilities: {
            id: string;
            name: string;
            description: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            organizationId: string;
            zoneId: string | null;
            kind: string;
            latitude: number;
            longitude: number;
            address: string | null;
            capacity: number | null;
            openingTime: string | null;
            closingTime: string | null;
        }[];
        roadSegments: {
            id: string;
            name: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            zoneId: string | null;
            osmId: string | null;
            geometry: string | null;
            oneWay: boolean;
            speedLimit: number | null;
            lanes: number | null;
            roadType: string | null;
        }[];
        restrictions: {
            id: string;
            description: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            zoneId: string | null;
            roadSegmentId: string | null;
            vehicleType: string | null;
            maxWeight: number | null;
            maxHeight: number | null;
            timeFrom: string | null;
            timeTo: string | null;
            daysOfWeek: string[];
            allowed: boolean;
        }[];
    } & {
        id: string;
        name: string;
        type: string | null;
        description: string | null;
        boundary: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, dto: UpdateZoneDto): Promise<{
        id: string;
        name: string;
        type: string | null;
        description: string | null;
        boundary: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: string): Promise<{
        id: string;
        name: string;
        type: string | null;
        description: string | null;
        boundary: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
