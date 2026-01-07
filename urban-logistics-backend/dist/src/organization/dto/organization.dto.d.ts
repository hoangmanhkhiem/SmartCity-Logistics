export declare class CreateOrganizationDto {
    name: string;
    type: string;
    business?: string;
    description?: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
}
export declare class UpdateOrganizationDto {
    name?: string;
    type?: string;
    business?: string;
    description?: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
    isActive?: boolean;
}
