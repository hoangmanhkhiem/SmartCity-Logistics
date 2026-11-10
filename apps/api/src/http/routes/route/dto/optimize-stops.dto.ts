import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

export class StopPointDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    id?: string;

    @ApiProperty({ example: 21.0285 })
    @IsNumber()
    lat!: number;

    @ApiProperty({ example: 105.854 })
    @IsNumber()
    lon!: number;
}

export class OptimizeStopsDto {
    @ApiProperty({ type: [StopPointDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => StopPointDto)
    points!: StopPointDto[];
}
