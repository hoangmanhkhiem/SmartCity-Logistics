import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsOptional, IsUUID } from 'class-validator';

export class BatchAssignLegsDto {
    @ApiProperty({ type: [String], description: 'Danh sách leg chưa gán — gom lên một xe' })
    @IsArray()
    @ArrayMinSize(1)
    @IsUUID('4', { each: true })
    legIds!: string[];

    @ApiProperty()
    @IsUUID()
    vehicleId!: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsUUID()
    driverId?: string;
}
