import { IsString, IsOptional, IsNumber, IsDateString, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
    @ApiPropertyOptional() @IsOptional() @IsNumber() weightKg?: number;
    @ApiPropertyOptional() @IsOptional() @IsInt() itemCount?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() codAmount?: number;
    @ApiPropertyOptional() @IsOptional() @IsDateString() timeWindowStart?: string;
    @ApiPropertyOptional() @IsOptional() @IsDateString() timeWindowEnd?: string;
    @ApiPropertyOptional() @IsOptional() @IsInt() priority?: number;
    @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() pickupPhone?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() deliveryPhone?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() sourceUrl?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() externalRef?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() fulfillmentChannel?: string;
}

export class UpdateOrderDto {
    @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
    @ApiPropertyOptional() @IsOptional() @IsInt() zoneId?: number;
    @ApiPropertyOptional() @IsOptional() @IsString() pickupAddress?: string;
    @ApiPropertyOptional() @IsOptional() @IsNumber() pickupLat?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() pickupLon?: number;
    @ApiPropertyOptional() @IsOptional() @IsString() deliveryAddress?: string;
    @ApiPropertyOptional() @IsOptional() @IsNumber() deliveryLat?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() deliveryLon?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() weightKg?: number;
    @ApiPropertyOptional() @IsOptional() @IsInt() itemCount?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() codAmount?: number;
    @ApiPropertyOptional() @IsOptional() @IsDateString() timeWindowStart?: string;
    @ApiPropertyOptional() @IsOptional() @IsDateString() timeWindowEnd?: string;
    @ApiPropertyOptional() @IsOptional() @IsInt() priority?: number;
    @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() pickupPhone?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() deliveryPhone?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() sourceUrl?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() externalRef?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() fulfillmentChannel?: string;
}
