import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TelemetryService } from './telemetry.service';
import { CreateTelemetryDto } from './dto';
import { JwtAuthGuard } from '../common/guards';

@Controller('telemetry')
@ApiTags('telemetry')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class TelemetryController {
    constructor(private readonly service: TelemetryService) { }

    @Post() @ApiOperation({ summary: 'Create telemetry record' })
    create(@Body() dto: CreateTelemetryDto) { return this.service.create(dto); }

    @Get() @ApiOperation({ summary: 'Get all telemetry data' })
    @ApiQuery({ name: 'page', required: false }) @ApiQuery({ name: 'limit', required: false })
    findAll(@Query('page') page?: number, @Query('limit') limit?: number) { return this.service.findAll(page, limit); }

    @Get('vehicle/:vehicleId') @ApiOperation({ summary: 'Get telemetry by vehicle' })
    @ApiQuery({ name: 'page', required: false }) @ApiQuery({ name: 'limit', required: false }) @ApiQuery({ name: 'from', required: false }) @ApiQuery({ name: 'to', required: false })
    findByVehicle(@Param('vehicleId') vehicleId: string, @Query('page') page?: number, @Query('limit') limit?: number, @Query('from') from?: string, @Query('to') to?: string) {
        return this.service.findByVehicle(vehicleId, page, limit, from ? new Date(from) : undefined, to ? new Date(to) : undefined);
    }

    @Get('vehicle/:vehicleId/latest') @ApiOperation({ summary: 'Get latest telemetry for vehicle' })
    getLatest(@Param('vehicleId') vehicleId: string) { return this.service.getLatest(vehicleId); }
}
