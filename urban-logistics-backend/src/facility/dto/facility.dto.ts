import { IsString, IsOptional, IsBoolean, IsNumber, IsUUID, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFacilityDto {
    @ApiProperty() @IsUUID() organizationId: string;
    @ApiPropertyOptional() @IsOptional() @IsUUID() zoneId?: string;
    @ApiProperty() @IsString() name: string;
    @ApiProperty() @IsString() kind: string; // hub, warehouse, charging_station, fuel_station, mfc
    @ApiProperty() @IsNumber() latitude: number;
    @ApiProperty() @IsNumber() longitude: number;
    @ApiPropertyOptional() @IsOptional() @IsString() address?: string;
    @ApiPropertyOptional() @IsOptional() @IsInt() capacity?: number;
    @ApiPropertyOptional() @IsOptional() @IsString() openingTime?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() closingTime?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
}

export class UpdateFacilityDto {
    @ApiPropertyOptional() @IsOptional() @IsUUID() zoneId?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() kind?: string;
    @ApiPropertyOptional() @IsOptional() @IsNumber() latitude?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() longitude?: number;
    @ApiPropertyOptional() @IsOptional() @IsString() address?: string;
    @ApiPropertyOptional() @IsOptional() @IsInt() capacity?: number;
    @ApiPropertyOptional() @IsOptional() @IsString() openingTime?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() closingTime?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
    @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}
