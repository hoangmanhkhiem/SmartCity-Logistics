import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TrackingService } from './tracking.service';

@ApiTags('tracking')
@Controller('tracking')
export class TrackingController {
    constructor(private readonly trackingService: TrackingService) {}

    @Get('search')
    @ApiOperation({
        summary: 'Tra cứu theo mã vận đơn, mã đơn hàng hoặc SĐT (9 số cuối, pickup/delivery)',
    })
    search(@Query('q') q?: string) {
        return this.trackingService.search(q);
    }

    @Get('shipments/:trackingNo')
    @ApiOperation({ summary: 'Tra cứu hành trình theo mã vận đơn (public)' })
    getShipment(@Param('trackingNo') trackingNo: string) {
        return this.trackingService.getByTrackingNo(trackingNo);
    }
}
