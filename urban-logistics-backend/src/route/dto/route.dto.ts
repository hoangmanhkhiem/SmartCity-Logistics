import { IsString, IsOptional, IsInt, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateRouteDto {
    @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
    @ApiPropertyOptional() @IsOptional() @IsDateString() plannedStartAt?: string;
    @ApiPropertyOptional() @IsOptional() @IsDateString() plannedEndAt?: string;
    @ApiPropertyOptional() @IsOptional() @IsInt() zoneId?: number;
    @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}
