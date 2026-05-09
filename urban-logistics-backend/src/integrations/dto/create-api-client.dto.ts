import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreateApiClientDto {
    @ApiProperty({ example: 'Shop ABC — Shopee' })
    @IsString()
    @MinLength(2)
    name!: string;
}
