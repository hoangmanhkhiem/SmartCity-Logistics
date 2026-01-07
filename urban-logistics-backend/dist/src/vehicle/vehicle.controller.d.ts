import { VehicleService } from './vehicle.service';
import { CreateVehicleDto, UpdateVehicleDto } from './dto';
export declare class VehicleController {
    private readonly service;
    constructor(service: VehicleService);
    create(dto: CreateVehicleDto): Promise<{
        carrier: {
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
        };
    } & {
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
    }>;
    findAll(page?: number, limit?: number, cId?: string, type?: string): Promise<{
        data: ({
            carrier: {
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
            };
        } & {
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
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(id: string): Promise<{
        carrier: {
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
        };
    } & {
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
    }>;
    update(id: string, dto: UpdateVehicleDto): Promise<{
        carrier: {
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
        };
    } & {
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
    }>;
    remove(id: string): Promise<{
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
    }>;
}
