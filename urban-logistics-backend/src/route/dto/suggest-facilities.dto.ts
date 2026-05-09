import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class SuggestFacilitiesDto {
    @ApiProperty() @IsNumber() originLat: number;
    @ApiProperty() @IsNumber() originLon: number;
    @ApiProperty() @IsNumber() destLat: number;
    @ApiProperty() @IsNumber() destLon: number;
    @ApiPropertyOptional({ type: [String], description: 'Mặc định warehouse, hub' })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    kinds?: string[];
    @ApiPropertyOptional({ default: 1500 }) @IsOptional() @IsNumber() @Min(50) @Max(20000) bufferMeters?: number;
    @ApiPropertyOptional({ default: 20 }) @IsOptional() @IsNumber() @Min(1) @Max(100) limit?: number;
    @ApiPropertyOptional({ description: 'ISO — lọc theo giờ mở/đóng (tùy chọn)' }) @IsOptional() @IsString()
    departureTime?: string;
    @ApiPropertyOptional({
        description: 'ISO — thời điểm áp dụng đoạn cấm khi chọn tuyến (mặc định = departureTime hoặc hiện tại)',
    })
    @IsOptional()
    @IsString()
    restrictionAt?: string;
    @ApiPropertyOptional({ description: 'Lọc quy định cấm đường theo loại xe khi routing' })
    @IsOptional()
    @IsString()
    restrictionVehicleType?: string;
}
