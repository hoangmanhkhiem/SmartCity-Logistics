import { IsString, IsOptional, IsBoolean, IsNumber, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRouteDto {
    @ApiProperty() @IsString() name: string;
    @ApiProperty() @IsString() mode: string; // road, rail, bike, van, …
    @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
    @ApiPropertyOptional() @IsOptional() @IsNumber() totalDistance?: number;
    @ApiPropertyOptional() @IsOptional() @IsInt() totalDuration?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() estimatedCo2?: number;
    @ApiPropertyOptional() @IsOptional() @IsString() geometry?: string; // GeoJSON
}

export class UpdateRouteDto {
    @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() mode?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
    @ApiPropertyOptional() @IsOptional() @IsNumber() totalDistance?: number;
    @ApiPropertyOptional() @IsOptional() @IsInt() totalDuration?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() estimatedCo2?: number;
    @ApiPropertyOptional() @IsOptional() @IsString() geometry?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
    @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}
