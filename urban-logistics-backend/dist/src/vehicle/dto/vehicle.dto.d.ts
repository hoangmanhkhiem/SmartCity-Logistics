export declare class CreateVehicleDto {
    carrierId: string;
    type: string;
    plate: string;
    brand?: string;
    model?: string;
    year?: number;
    capacity?: number;
    volume?: number;
    fuelType?: string;
    isElectric?: boolean;
    emissionStandard?: string;
    emissionFactor?: number;
    range?: number;
}
export declare class UpdateVehicleDto {
    type?: string;
    plate?: string;
    brand?: string;
    model?: string;
    capacity?: number;
    volume?: number;
    fuelType?: string;
    isElectric?: boolean;
    emissionStandard?: string;
    emissionFactor?: number;
    status?: string;
    isActive?: boolean;
}
