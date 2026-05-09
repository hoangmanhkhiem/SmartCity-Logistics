import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards';
import { DriversService } from './drivers.service';

@ApiTags('drivers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('drivers')
export class DriversController {
    constructor(private readonly driversService: DriversService) {}

    @Get()
    @ApiOperation({ summary: 'Danh sách tài xế (role driver)' })
    list() {
        return this.driversService.listDrivers();
    }

    @Get(':id/stats')
    @ApiOperation({ summary: 'Hiệu suất / phân công gần đây' })
    stats(@Param('id') id: string) {
        return this.driversService.driverStats(id);
    }
}
