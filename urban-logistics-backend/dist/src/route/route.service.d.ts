import { PrismaService } from '../prisma/prisma.service';
import { CreateRouteDto, UpdateRouteDto } from './dto';
export declare class RouteService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateRouteDto): Promise<{
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
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        status: string;
        mode: string;
        totalDistance: number | null;
        totalDuration: number | null;
        estimatedCo2: number | null;
        geometry: string | null;
    }>;
    findAll(page?: number, limit?: number, mode?: string, status?: string): Promise<{
        data: ({
            _count: {
                legs: number;
            };
        } & {
            id: string;
            name: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            status: string;
            mode: string;
            totalDistance: number | null;
            totalDuration: number | null;
            estimatedCo2: number | null;
            geometry: string | null;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(id: string): Promise<{
        legs: ({
            assignments: ({
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
                updatedAt: Date;
                status: string;
                notes: string | null;
                startedAt: Date | null;
                vehicleId: string;
                legId: string;
                driverId: string | null;
                assignedAt: Date;
                completedAt: Date | null;
            })[];
            stops: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                type: string;
                address: string | null;
                latitude: number | null;
                longitude: number | null;
                status: string;
                notes: string | null;
                sequence: number;
                legId: string;
                facilityId: string | null;
                arrival: Date | null;
                departure: Date | null;
            }[];
        } & {
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
        })[];
    } & {
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        status: string;
        mode: string;
        totalDistance: number | null;
        totalDuration: number | null;
        estimatedCo2: number | null;
        geometry: string | null;
    }>;
    update(id: string, dto: UpdateRouteDto): Promise<{
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        status: string;
        mode: string;
        totalDistance: number | null;
        totalDuration: number | null;
        estimatedCo2: number | null;
        geometry: string | null;
    }>;
    remove(id: string): Promise<{
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        status: string;
        mode: string;
        totalDistance: number | null;
        totalDuration: number | null;
        estimatedCo2: number | null;
        geometry: string | null;
    }>;
}
