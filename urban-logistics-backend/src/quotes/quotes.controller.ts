import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards';
import { QuotesService } from './quotes.service';

@ApiTags('quotes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('quotes')
export class QuotesController {
    constructor(private readonly quotesService: QuotesService) {}

    @Get('compare')
    @ApiOperation({ summary: 'So sánh phí & ETA theo carrier (stub tối ưu chi phí)' })
    @ApiQuery({ name: 'pickupLat', required: true })
    @ApiQuery({ name: 'pickupLon', required: true })
    @ApiQuery({ name: 'deliveryLat', required: true })
    @ApiQuery({ name: 'deliveryLon', required: true })
    @ApiQuery({ name: 'weightKg', required: false })
    compare(
        @Query('pickupLat') pickupLat: string,
        @Query('pickupLon') pickupLon: string,
        @Query('deliveryLat') deliveryLat: string,
        @Query('deliveryLon') deliveryLon: string,
        @Query('weightKg') weightKg?: string,
    ) {
        return this.quotesService.compareCarriers({
            pickupLat: Number(pickupLat),
            pickupLon: Number(pickupLon),
            deliveryLat: Number(deliveryLat),
            deliveryLon: Number(deliveryLon),
            weightKg: weightKg != null && weightKg !== '' ? Number(weightKg) : undefined,
        });
    }
}
