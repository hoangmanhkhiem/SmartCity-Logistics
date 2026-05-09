import { IsString, IsOptional, IsNumber, IsUUID, IsDateString, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrderDto {
    @ApiPropertyOptional() @IsOptional() @IsUUID() customerId?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() pickupAddress?: string;
    @ApiPropertyOptional() @IsOptional() @IsNumber() pickupLat?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() pickupLon?: number;
    @ApiPropertyOptional() @IsOptional() @IsString() deliveryAddress?: string;
    @ApiPropertyOptional() @IsOptional() @IsNumber() deliveryLat?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() deliveryLon?: number;
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
    @ApiPropertyOptional() @IsOptional() @IsString() pickupAddress?: string;
    @ApiPropertyOptional() @IsOptional() @IsNumber() pickupLat?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() pickupLon?: number;
    @ApiPropertyOptional() @IsOptional() @IsString() deliveryAddress?: string;
    @ApiPropertyOptional() @IsOptional() @IsNumber() deliveryLat?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() deliveryLon?: number;
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
