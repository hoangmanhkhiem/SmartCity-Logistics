import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
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

    @Post('snapshot')
    @ApiOperation({ summary: 'Ghi snapshot thống kê cho ngày hiện tại (gọi thủ công hoặc qua cron ngoài, 1 lần/ngày)' })
    createSnapshot() {
        return this.analyticsService.createSnapshot();
    }

    @Get('trend')
    @ApiOperation({ summary: 'Chuỗi thời gian snapshot theo ngày (biểu đồ xu hướng)' })
    @ApiQuery({ name: 'carrierId', required: false }) @ApiQuery({ name: 'from', required: false }) @ApiQuery({ name: 'to', required: false })
    trend(@Query('carrierId') carrierId?: string, @Query('from') from?: string, @Query('to') to?: string) {
        return this.analyticsService.getTrend({ carrierId: carrierId ? Number(carrierId) : undefined, from, to });
    }

    @Get('compliance-report')
    @ApiOperation({ summary: 'Báo cáo tuân thủ + CO2 + kinh tế theo carrier (Regulator)' })
    @ApiQuery({ name: 'from', required: false }) @ApiQuery({ name: 'to', required: false })
    complianceReport(@Query('from') from?: string, @Query('to') to?: string) {
        return this.analyticsService.getComplianceReport({ from, to });
    }
}
