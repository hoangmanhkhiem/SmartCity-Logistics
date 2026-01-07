import { IsUUID, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTelemetryDto {
    @ApiProperty() @IsUUID() vehicleId: string;
    @ApiProperty() @IsNumber() latitude: number;
    @ApiProperty() @IsNumber() longitude: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() speed?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() heading?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() altitude?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() batteryLevel?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() fuelLevel?: number;
    @ApiPropertyOptional() @IsOptional() @IsString() engineStatus?: string;
    @ApiPropertyOptional() @IsOptional() @IsNumber() odometer?: number;
}
