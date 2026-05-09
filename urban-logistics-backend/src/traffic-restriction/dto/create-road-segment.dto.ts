import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class CreateRoadSegmentDto {
    @ApiPropertyOptional() @IsOptional() @IsUUID() zoneId?: string;
    @ApiProperty() @IsString() name: string;
    @ApiPropertyOptional({ description: 'GeoJSON LineString hoặc Feature chứa LineString (JSON string)' })
    @IsOptional()
    @IsString()
    geometry?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() osmId?: string;
    @ApiPropertyOptional() @IsOptional() @IsBoolean() oneWay?: boolean;
    @ApiPropertyOptional() @IsOptional() @IsNumber() speedLimit?: number;
    @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(8) lanes?: number;
    @ApiPropertyOptional() @IsOptional() @IsString() roadType?: string;
    @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}
