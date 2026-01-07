export declare class CreateFacilityDto {
    organizationId: string;
    zoneId?: string;
    name: string;
    kind: string;
    latitude: number;
    longitude: number;
    address?: string;
    capacity?: number;
    openingTime?: string;
    closingTime?: string;
    description?: string;
}
export declare class UpdateFacilityDto {
    zoneId?: string;
    name?: string;
    kind?: string;
    latitude?: number;
    longitude?: number;
    address?: string;
    capacity?: number;
    openingTime?: string;
    closingTime?: string;
    description?: string;
    isActive?: boolean;
}
