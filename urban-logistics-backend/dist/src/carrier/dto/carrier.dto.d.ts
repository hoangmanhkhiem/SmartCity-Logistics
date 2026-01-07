export declare class CreateCarrierDto {
    organizationId: string;
    name: string;
    scale?: string;
    vehicleCount?: number;
    warehouseCount?: number;
    contactName?: string;
    contactPhone?: string;
    contactEmail?: string;
}
export declare class UpdateCarrierDto {
    name?: string;
    scale?: string;
    vehicleCount?: number;
    warehouseCount?: number;
    contactName?: string;
    contactPhone?: string;
    contactEmail?: string;
    isActive?: boolean;
}
