import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class DrivingSegmentDto {
    @ApiProperty() @IsNumber() originLat: number;
    @ApiProperty() @IsNumber() originLon: number;
    @ApiProperty() @IsNumber() destLat: number;
    @ApiProperty() @IsNumber() destLon: number;
    @ApiPropertyOptional({ description: 'ISO 8601 — thời điểm áp dụng đoạn cấm/hạn chế' })
    @IsOptional()
    @IsString()
    restrictionAt?: string;
    @ApiPropertyOptional({ description: 'Lọc quy định theo loại xe (vd truck)' })
    @IsOptional()
    @IsString()
    restrictionVehicleType?: string;
}
