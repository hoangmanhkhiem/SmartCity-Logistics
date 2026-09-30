import { IsString, IsOptional, IsInt, IsDateString, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export const ROUTE_STATUSES = ['planned', 'in_progress', 'completed', 'cancelled'] as const;

export class UpdateRouteDto {
    @ApiPropertyOptional({ enum: ROUTE_STATUSES }) @IsOptional() @IsIn(ROUTE_STATUSES) status?: string;
    @ApiPropertyOptional() @IsOptional() @IsDateString() plannedStartAt?: string;
    @ApiPropertyOptional() @IsOptional() @IsDateString() plannedEndAt?: string;
    @ApiPropertyOptional() @IsOptional() @IsInt() zoneId?: number;
    @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}
