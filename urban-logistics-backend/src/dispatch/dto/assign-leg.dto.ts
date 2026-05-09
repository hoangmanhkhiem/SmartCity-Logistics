import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class AssignLegDto {
    @ApiProperty()
    @IsUUID()
    legId!: string;

    @ApiProperty()
    @IsUUID()
    vehicleId!: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsUUID()
    driverId?: string;
}
