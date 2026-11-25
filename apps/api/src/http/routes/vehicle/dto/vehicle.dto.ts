import { IsString, IsOptional, IsBoolean, IsNumber, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVehicleDto {
    @ApiProperty() @IsInt() carrierId: number;
    @ApiProperty() @IsString() type: string;
    @ApiProperty() @IsString() plate: string;
    @ApiPropertyOptional() @IsOptional() @IsString() brand?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() model?: string;
    @ApiPropertyOptional() @IsOptional() @IsNumber() year?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() capacity?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() volume?: number;
    @ApiPropertyOptional() @IsOptional() @IsString() fuelType?: string;
    @ApiPropertyOptional() @IsOptional() @IsBoolean() isElectric?: boolean;
    @ApiPropertyOptional() @IsOptional() @IsString() emissionStandard?: string;
    @ApiPropertyOptional() @IsOptional() @IsNumber() emissionFactor?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() range?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() payloadKg?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() cargoM3?: number;
    @ApiPropertyOptional() @IsOptional() @IsBoolean() lezAllowed?: boolean;
    @ApiPropertyOptional() @IsOptional() @IsNumber() co2GPerKm?: number;
}

export class UpdateVehicleDto {
    @ApiPropertyOptional() @IsOptional() @IsString() type?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() plate?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() brand?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() model?: string;
    @ApiPropertyOptional() @IsOptional() @IsNumber() capacity?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() volume?: number;
    @ApiPropertyOptional() @IsOptional() @IsString() fuelType?: string;
    @ApiPropertyOptional() @IsOptional() @IsBoolean() isElectric?: boolean;
    @ApiPropertyOptional() @IsOptional() @IsString() emissionStandard?: string;
    @ApiPropertyOptional() @IsOptional() @IsNumber() emissionFactor?: number;
    @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
    @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
    @ApiPropertyOptional() @IsOptional() @IsNumber() payloadKg?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() cargoM3?: number;
    @ApiPropertyOptional() @IsOptional() @IsBoolean() lezAllowed?: boolean;
    @ApiPropertyOptional() @IsOptional() @IsNumber() co2GPerKm?: number;
}
