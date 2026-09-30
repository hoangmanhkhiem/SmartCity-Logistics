import { IsString, IsOptional, IsBoolean, IsInt, IsArray, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCarrierDto {
    @ApiProperty() @IsInt() organizationId: number;
    @ApiProperty() @IsString() name: string;
    @ApiPropertyOptional() @IsOptional() @IsString() contactName?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() contactPhone?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() contactEmail?: string;
    @ApiPropertyOptional({ description: 'Phí mở chuyến (VNĐ)' }) @IsOptional() @IsInt() @Min(0) baseFeeVnd?: number;
    @ApiPropertyOptional({ description: 'Phí mỗi km (VNĐ)' }) @IsOptional() @IsInt() @Min(0) perKmFeeVnd?: number;
    @ApiPropertyOptional({ description: 'Phí mỗi kg vượt 1kg đầu (VNĐ)' }) @IsOptional() @IsInt() @Min(0) perKgFeeVnd?: number;
}

export class UpdateCarrierDto {
    @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() contactName?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() contactPhone?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() contactEmail?: string;
    @ApiPropertyOptional({ description: 'Phí mở chuyến (VNĐ)' }) @IsOptional() @IsInt() @Min(0) baseFeeVnd?: number;
    @ApiPropertyOptional({ description: 'Phí mỗi km (VNĐ)' }) @IsOptional() @IsInt() @Min(0) perKmFeeVnd?: number;
    @ApiPropertyOptional({ description: 'Phí mỗi kg vượt 1kg đầu (VNĐ)' }) @IsOptional() @IsInt() @Min(0) perKgFeeVnd?: number;
    @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}

export class UpdateCarrierZonesDto {
    @ApiProperty({ type: [Number] }) @IsArray() @IsInt({ each: true }) zoneIds: number[];
}
