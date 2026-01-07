import { PrismaService } from '../prisma/prisma.service';
import { CreateFacilityDto, UpdateFacilityDto } from './dto';
export declare class FacilityService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateFacilityDto): Promise<{
        organization: {
            id: string;
            name: string;
            address: string | null;
            description: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            type: string;
            business: string | null;
            phone: string | null;
            email: string | null;
            website: string | null;
            logoUrl: string | null;
        };
        zone: {
            id: string;
            name: string;
            description: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            type: string | null;
            boundary: string | null;
        };
    } & {
        id: string;
        name: string;
        kind: string;
        latitude: number;
        longitude: number;
        address: string | null;
        capacity: number | null;
        openingTime: string | null;
        closingTime: string | null;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        zoneId: string | null;
    }>;
    findAll(page?: number, limit?: number, organizationId?: string, kind?: string, zoneId?: string): Promise<{
        data: ({
            organization: {
                id: string;
                name: string;
                address: string | null;
                description: string | null;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                type: string;
                business: string | null;
                phone: string | null;
                email: string | null;
                website: string | null;
                logoUrl: string | null;
            };
            zone: {
                id: string;
                name: string;
                description: string | null;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                type: string | null;
                boundary: string | null;
            };
            _count: {
                chargers: number;
                fuelPumps: number;
                docks: number;
            };
        } & {
            id: string;
            name: string;
            kind: string;
            latitude: number;
            longitude: number;
            address: string | null;
            capacity: number | null;
            openingTime: string | null;
            closingTime: string | null;
            description: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            organizationId: string;
            zoneId: string | null;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(id: string): Promise<{
        organization: {
            id: string;
            name: string;
            address: string | null;
            description: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            type: string;
            business: string | null;
            phone: string | null;
            email: string | null;
            website: string | null;
            logoUrl: string | null;
        };
        zone: {
            id: string;
            name: string;
            description: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            type: string | null;
            boundary: string | null;
        };
        chargers: {
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            type: string;
            facilityId: string;
            connectorType: string | null;
            powerKw: number;
            slots: number;
            pricePerKwh: number | null;
            status: string;
        }[];
        fuelPumps: {
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            facilityId: string;
            status: string;
            fuelType: string;
            pricePerLiter: number | null;
        }[];
        docks: {
            id: string;
            name: string | null;
            capacity: number;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            facilityId: string;
            status: string;
        }[];
    } & {
        id: string;
        name: string;
        kind: string;
        latitude: number;
        longitude: number;
        address: string | null;
        capacity: number | null;
        openingTime: string | null;
        closingTime: string | null;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        zoneId: string | null;
    }>;
    update(id: string, dto: UpdateFacilityDto): Promise<{
        organization: {
            id: string;
            name: string;
            address: string | null;
            description: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            type: string;
            business: string | null;
            phone: string | null;
            email: string | null;
            website: string | null;
            logoUrl: string | null;
        };
        zone: {
            id: string;
            name: string;
            description: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            type: string | null;
            boundary: string | null;
        };
    } & {
        id: string;
        name: string;
        kind: string;
        latitude: number;
        longitude: number;
        address: string | null;
        capacity: number | null;
        openingTime: string | null;
        closingTime: string | null;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        zoneId: string | null;
    }>;
    remove(id: string): Promise<{
        id: string;
        name: string;
        kind: string;
        latitude: number;
        longitude: number;
        address: string | null;
        capacity: number | null;
        openingTime: string | null;
        closingTime: string | null;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        zoneId: string | null;
    }>;
}
