import { IsString, IsOptional, IsBoolean, IsInt, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCarrierDto {
    @ApiProperty() @IsUUID() organizationId: string;
    @ApiProperty() @IsString() name: string;
    @ApiPropertyOptional() @IsOptional() @IsString() scale?: string;
    @ApiPropertyOptional() @IsOptional() @IsInt() vehicleCount?: number;
    @ApiPropertyOptional() @IsOptional() @IsInt() warehouseCount?: number;
    @ApiPropertyOptional() @IsOptional() @IsString() contactName?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() contactPhone?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() contactEmail?: string;
}

export class UpdateCarrierDto {
    @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() scale?: string;
    @ApiPropertyOptional() @IsOptional() @IsInt() vehicleCount?: number;
    @ApiPropertyOptional() @IsOptional() @IsInt() warehouseCount?: number;
    @ApiPropertyOptional() @IsOptional() @IsString() contactName?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() contactPhone?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() contactEmail?: string;
    @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}
