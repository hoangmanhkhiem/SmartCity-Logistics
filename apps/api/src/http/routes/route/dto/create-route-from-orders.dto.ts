import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsBoolean, IsDateString, IsInt, IsOptional } from 'class-validator';

export class CreateRouteFromOrdersDto {
    @ApiProperty() @IsInt() carrierId: number;
    @ApiProperty() @IsInt() vehicleId: number;
    @ApiProperty() @IsInt() shipperId: number;
    @ApiPropertyOptional() @IsOptional() @IsInt() zoneId?: number;
    @ApiProperty({ type: [Number] }) @IsArray() @ArrayMinSize(1) @IsInt({ each: true }) orderIds: number[];
    @ApiProperty() @IsDateString() shiftDate: string;
    @ApiPropertyOptional() @IsOptional() @IsDateString() plannedStartAt?: string;
    @ApiPropertyOptional({ description: 'Bỏ qua cảnh báo restriction và vẫn tạo route' })
    @IsOptional()
    @IsBoolean()
    force?: boolean;
}
