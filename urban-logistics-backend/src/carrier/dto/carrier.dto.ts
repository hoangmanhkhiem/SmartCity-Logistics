import { IsString, IsOptional, IsBoolean, IsInt, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCarrierDto {
    @ApiProperty() @IsInt() organizationId: number;
    @ApiProperty() @IsString() name: string;
    @ApiPropertyOptional() @IsOptional() @IsString() contactName?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() contactPhone?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() contactEmail?: string;
}

export class UpdateCarrierDto {
    @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() contactName?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() contactPhone?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() contactEmail?: string;
    @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}

export class UpdateCarrierZonesDto {
    @ApiProperty({ type: [Number] }) @IsArray() @IsInt({ each: true }) zoneIds: number[];
}
