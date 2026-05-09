import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) {}

    @Get('platform-summary')
    @ApiOperation({ summary: 'Tổng quan nền tảng: đơn, xe, điều phối, CO2 (dashboard)' })
    summary() {
        return this.analyticsService.platformSummary();
    }
}
