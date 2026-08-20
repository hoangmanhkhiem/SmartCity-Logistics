import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class ClockInDto {
    @ApiProperty() @IsInt() vehicleId: number;
}

export class CompleteStopDto {
    @ApiPropertyOptional() @IsOptional() @IsString() podPhotoUrl?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() podSignatureUrl?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() podNote?: string;
    @ApiPropertyOptional() @IsOptional() codAmountCollected?: number;
}

export class FailStopDto {
    @ApiProperty() @IsString() failedReason: string;
    @ApiPropertyOptional() @IsOptional() @IsString() note?: string;
}

export class CreateShipperProfileDto {
    @ApiProperty() @IsInt() userId: number;
    @ApiProperty() @IsInt() carrierId: number;
    @ApiPropertyOptional() @IsOptional() @IsString() licenseNumber?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() licenseClass?: string;
    @ApiPropertyOptional() @IsOptional() @IsInt() defaultZoneId?: number;
}
