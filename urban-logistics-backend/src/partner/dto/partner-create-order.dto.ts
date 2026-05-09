import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class PartnerCreateOrderDto {
    @ApiProperty({ example: 'Số 1 Đinh Tiên Hoàng, Hoàn Kiếm' })
    @IsString()
    pickupAddress!: string;

    @ApiProperty({ example: 'Số 10 Phạm Hùng, Cầu Giấy' })
    @IsString()
    deliveryAddress!: string;

    @ApiPropertyOptional() @IsOptional() @IsString() pickupPhone?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() deliveryPhone?: string;
    @ApiPropertyOptional({ description: 'Link đơn Shopee / website nguồn' }) @IsOptional() @IsString() sourceUrl?: string;
    @ApiPropertyOptional({ description: 'Mã tham chiếu phía đối tác (idempotent)' }) @IsOptional() @IsString() externalRef?: string;
    @ApiPropertyOptional({ enum: ['fleet', 'marketplace_carrier', 'hybrid'] }) @IsOptional() @IsString() fulfillmentChannel?: string;

    @ApiPropertyOptional() @IsOptional() @IsNumber() pickupLat?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() pickupLon?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() deliveryLat?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() deliveryLon?: number;

    @ApiPropertyOptional() @IsOptional() @IsDateString() timeWindowStart?: string;
    @ApiPropertyOptional() @IsOptional() @IsDateString() timeWindowEnd?: string;

    @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(5) priority?: number;
    @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;

    @ApiPropertyOptional() @IsOptional() @IsNumber() weightKg?: number;
    @ApiPropertyOptional() @IsOptional() @IsInt() itemCount?: number;
    @ApiPropertyOptional() @IsOptional() @IsString() itemDescription?: string;
    @ApiPropertyOptional() @IsOptional() @IsNumber() estimatedDistanceKm?: number;
    @ApiPropertyOptional() @IsOptional() @IsInt() estimatedDurationMin?: number;
}
