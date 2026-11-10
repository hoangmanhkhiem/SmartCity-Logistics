import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard } from '../../middlewares/guards';
import { Public, Roles } from '../../middlewares/decorators';
import { TrafficService } from './traffic.service';

@Controller('traffic')
@ApiTags('traffic')
export class TrafficController {
    constructor(private readonly traffic: TrafficService) {}

    @Get('segments')
    @Public()
    @ApiOperation({ summary: 'Lớp mức tắc từ agg_speed_profile (Mapbox styling)' })
    segments() {
        return this.traffic.layers();
    }

    @Get('wards')
    @Public()
    @ApiOperation({ summary: 'Chỉ số tắc theo phường' })
    wards() {
        return this.traffic.wards();
    }

    @Get('quota')
    @Public()
    quota() {
        return this.traffic.quotaStatus();
    }

    @Post('sample')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('platform_admin', 'sys_admin', 'researcher')
    @ApiOperation({ summary: 'Gọi TomTom Flow Segment hoặc mẫu khảo sát, rồi tính lại profile' })
    sample() {
        return this.traffic.sampleNow();
    }

    @Post('aggregate')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('platform_admin', 'sys_admin', 'researcher')
    aggregate() {
        return this.traffic.aggregate();
    }
}
