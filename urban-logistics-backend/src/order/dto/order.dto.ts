import { IsString, IsOptional, IsNumber, IsDateString, IsInt, Min, Max, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const ORDER_STATUSES = ['pending', 'assigned', 'in_transit', 'delivered', 'failed', 'cancelled'] as const;

export class CreateOrderDto {
    @ApiProperty() @IsInt() carrierId: number;
    @ApiPropertyOptional() @IsOptional() @IsInt() customerId?: number;
    @ApiPropertyOptional() @IsOptional() @IsInt() zoneId?: number;
    @ApiPropertyOptional() @IsOptional() @IsString() pickupAddress?: string;
    @ApiPropertyOptional() @IsOptional() @IsNumber() pickupLat?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() pickupLon?: number;
    @ApiPropertyOptional() @IsOptional() @IsString() deliveryAddress?: string;
    @ApiPropertyOptional() @IsOptional() @IsNumber() deliveryLat?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() deliveryLon?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0.01) @Max(2000) weightKg?: number;
    @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) itemCount?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) codAmount?: number;
    @ApiPropertyOptional() @IsOptional() @IsDateString() timeWindowStart?: string;
    @ApiPropertyOptional() @IsOptional() @IsDateString() timeWindowEnd?: string;
    @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(10) priority?: number;
    @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() pickupPhone?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() deliveryPhone?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() sourceUrl?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() externalRef?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() fulfillmentChannel?: string;
}

export class UpdateOrderDto {
    @ApiPropertyOptional({ enum: ORDER_STATUSES }) @IsOptional() @IsIn(ORDER_STATUSES) status?: string;
    @ApiPropertyOptional() @IsOptional() @IsInt() zoneId?: number;
    @ApiPropertyOptional() @IsOptional() @IsString() pickupAddress?: string;
    @ApiPropertyOptional() @IsOptional() @IsNumber() pickupLat?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() pickupLon?: number;
    @ApiPropertyOptional() @IsOptional() @IsString() deliveryAddress?: string;
    @ApiPropertyOptional() @IsOptional() @IsNumber() deliveryLat?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() deliveryLon?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0.01) @Max(2000) weightKg?: number;
    @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) itemCount?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) codAmount?: number;
    @ApiPropertyOptional() @IsOptional() @IsDateString() timeWindowStart?: string;
    @ApiPropertyOptional() @IsOptional() @IsDateString() timeWindowEnd?: string;
    @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(10) priority?: number;
    @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() pickupPhone?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() deliveryPhone?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() sourceUrl?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() externalRef?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() fulfillmentChannel?: string;
}
