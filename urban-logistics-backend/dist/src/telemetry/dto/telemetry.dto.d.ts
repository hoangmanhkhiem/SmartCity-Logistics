export declare class CreateTelemetryDto {
    vehicleId: string;
    latitude: number;
    longitude: number;
    speed?: number;
    heading?: number;
    altitude?: number;
    batteryLevel?: number;
    fuelLevel?: number;
    engineStatus?: string;
    odometer?: number;
}
