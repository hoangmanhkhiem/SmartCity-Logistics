import { PrismaService } from '../prisma/prisma.service';
import { CreateTelemetryDto } from './dto';
export declare class TelemetryService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateTelemetryDto): Promise<{
        vehicle: {
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
        };
    } & {
        id: string;
        createdAt: Date;
        latitude: number;
        longitude: number;
        vehicleId: string;
        timestamp: Date;
        speed: number | null;
        heading: number | null;
        altitude: number | null;
        batteryLevel: number | null;
        fuelLevel: number | null;
        engineStatus: string | null;
        odometer: number | null;
    }>;
    findByVehicle(vehicleId: string, page?: number, limit?: number, from?: Date, to?: Date): Promise<{
        data: {
            id: string;
            createdAt: Date;
            latitude: number;
            longitude: number;
            vehicleId: string;
            timestamp: Date;
            speed: number | null;
            heading: number | null;
            altitude: number | null;
            batteryLevel: number | null;
            fuelLevel: number | null;
            engineStatus: string | null;
            odometer: number | null;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getLatest(vehicleId: string): Promise<{
        vehicle: {
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
        };
    } & {
        id: string;
        createdAt: Date;
        latitude: number;
        longitude: number;
        vehicleId: string;
        timestamp: Date;
        speed: number | null;
        heading: number | null;
        altitude: number | null;
        batteryLevel: number | null;
        fuelLevel: number | null;
        engineStatus: string | null;
        odometer: number | null;
    }>;
    findAll(page?: number, limit?: number): Promise<{
        data: ({
            vehicle: {
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
            };
        } & {
            id: string;
            createdAt: Date;
            latitude: number;
            longitude: number;
            vehicleId: string;
            timestamp: Date;
            speed: number | null;
            heading: number | null;
            altitude: number | null;
            batteryLevel: number | null;
            fuelLevel: number | null;
            engineStatus: string | null;
            odometer: number | null;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
}
