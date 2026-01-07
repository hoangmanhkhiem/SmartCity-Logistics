export declare class CreateZoneDto {
    name: string;
    type?: string;
    description?: string;
    boundary?: string;
}
export declare class UpdateZoneDto {
    name?: string;
    type?: string;
    description?: string;
    boundary?: string;
    isActive?: boolean;
}
