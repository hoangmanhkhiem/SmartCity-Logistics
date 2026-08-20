import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateRestrictionDto {
    @ApiPropertyOptional() @IsOptional() @IsInt() roadSegmentId?: number;
    @ApiPropertyOptional() @IsOptional() @IsInt() zoneId?: number;
    @ApiPropertyOptional() @IsOptional() @IsString() vehicleType?: string;
    @ApiPropertyOptional({ type: [String], description: 'Rỗng = mọi loại xe' })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    vehicleTypes?: string[];
    @ApiPropertyOptional({
        enum: ['prohibited', 'restricted', 'allowed_window'],
        description: 'Mức độ — map màu bản đồ',
    })
    @IsOptional()
    @IsString()
    severity?: string;
    @ApiPropertyOptional() @IsOptional() @IsNumber() maxWeight?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() maxHeight?: number;
    @ApiPropertyOptional() @IsOptional() @IsString() timeFrom?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() timeTo?: string;
    @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @IsString({ each: true }) daysOfWeek?: string[];
    @ApiPropertyOptional() @IsOptional() @IsBoolean() allowed?: boolean;
    @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
    @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}
