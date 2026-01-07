import { PrismaService } from '../prisma/prisma.service';
import { CreateCarrierDto, UpdateCarrierDto } from './dto';
export declare class CarrierService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(createDto: CreateCarrierDto): Promise<{
        organization: {
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
        };
    } & {
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
    }>;
    findAll(page?: number, limit?: number, organizationId?: string): Promise<{
        data: ({
            _count: {
                vehicles: number;
            };
            organization: {
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
            };
        } & {
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
        };
        vehicles: {
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            type: string;
            capacity: number | null;
            carrierId: string;
            plate: string;
            brand: string | null;
            model: string | null;
            year: number | null;
            volume: number | null;
            fuelType: string | null;
            isElectric: boolean;
            emissionStandard: string | null;
            emissionFactor: number | null;
            range: number | null;
            currentBatteryLevel: number | null;
            status: string;
        }[];
    } & {
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
    }>;
    update(id: string, updateDto: UpdateCarrierDto): Promise<{
        organization: {
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
        };
    } & {
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
    }>;
    remove(id: string): Promise<{
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
    }>;
}
