export declare class CreateRouteDto {
    name: string;
    mode: string;
    description?: string;
    totalDistance?: number;
    totalDuration?: number;
    estimatedCo2?: number;
    geometry?: string;
}
export declare class UpdateRouteDto {
    name?: string;
    mode?: string;
    description?: string;
    totalDistance?: number;
    totalDuration?: number;
    estimatedCo2?: number;
    geometry?: string;
    status?: string;
    isActive?: boolean;
}
