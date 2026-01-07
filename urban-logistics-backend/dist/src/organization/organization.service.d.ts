import { PrismaService } from '../prisma/prisma.service';
import { CreateOrganizationDto, UpdateOrganizationDto } from './dto';
export declare class OrganizationService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(createDto: CreateOrganizationDto): Promise<{
        id: string;
        email: string | null;
        name: string;
        phone: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        business: string | null;
        description: string | null;
        address: string | null;
        website: string | null;
        logoUrl: string | null;
    }>;
    findAll(page?: number, limit?: number, type?: string): Promise<{
        data: ({
            _count: {
                carriers: number;
                facilities: number;
            };
        } & {
            id: string;
            email: string | null;
            name: string;
            phone: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            type: string;
            business: string | null;
            description: string | null;
            address: string | null;
            website: string | null;
            logoUrl: string | null;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(id: string): Promise<{
        _count: {
            memberships: number;
            carriers: number;
            facilities: number;
        };
        carriers: {
            id: string;
            name: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            organizationId: string;
            scale: string | null;
            vehicleCount: number | null;
            warehouseCount: number | null;
            contactName: string | null;
            contactPhone: string | null;
            contactEmail: string | null;
        }[];
        facilities: {
            id: string;
            name: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            organizationId: string;
            description: string | null;
            address: string | null;
            zoneId: string | null;
            kind: string;
            latitude: number;
            longitude: number;
            capacity: number | null;
            openingTime: string | null;
            closingTime: string | null;
        }[];
    } & {
        id: string;
        email: string | null;
        name: string;
        phone: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        business: string | null;
        description: string | null;
        address: string | null;
        website: string | null;
        logoUrl: string | null;
    }>;
    update(id: string, updateDto: UpdateOrganizationDto): Promise<{
        id: string;
        email: string | null;
        name: string;
        phone: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        business: string | null;
        description: string | null;
        address: string | null;
        website: string | null;
        logoUrl: string | null;
    }>;
    remove(id: string): Promise<{
        id: string;
        email: string | null;
        name: string;
        phone: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        business: string | null;
        description: string | null;
        address: string | null;
        website: string | null;
        logoUrl: string | null;
    }>;
}
