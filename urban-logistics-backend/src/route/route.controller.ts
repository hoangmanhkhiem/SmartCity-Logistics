import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { RouteService } from './route.service';
import { CreateRouteDto, OptimizeStopsDto, UpdateRouteDto } from './dto';
import { SuggestFacilitiesDto } from './dto/suggest-facilities.dto';
import { DrivingSegmentDto } from './dto/driving-segment.dto';
import { JwtAuthGuard } from '../common/guards';

@Controller('routes')
@ApiTags('routes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class RouteController {
    constructor(private readonly service: RouteService) { }

    @Post() @ApiOperation({ summary: 'Create route' })
    create(@Body() dto: CreateRouteDto) { return this.service.create(dto); }

    @Post('optimize-stops') @ApiOperation({ summary: 'Tối ưu thứ tự điểm (nearest-neighbor / VRP-lite)' })
    optimizeStops(@Body() dto: OptimizeStopsDto) { return this.service.optimizeStopSequence(dto.points); }

    @Post('suggest-facilities') @ApiOperation({ summary: 'Gợi ý kho/hub gần tuyến lái xe tối ưu (Mapbox + buffer)' })
    suggestFacilities(@Body() dto: SuggestFacilitiesDto) { return this.service.suggestFacilitiesAlongRoute(dto); }

    @Post('driving-segment') @ApiOperation({ summary: 'Một đoạn lái xe, tránh chồng lấp với đoạn cấm (phương án Mapbox)' })
    drivingSegment(@Body() dto: DrivingSegmentDto) { return this.service.drivingSegmentAvoidingRestrictions(dto); }

    @Get() @ApiOperation({ summary: 'Get all routes' })
    @ApiQuery({ name: 'page', required: false }) @ApiQuery({ name: 'limit', required: false }) @ApiQuery({ name: 'mode', required: false }) @ApiQuery({ name: 'status', required: false })
    findAll(@Query('page') page?: number, @Query('limit') limit?: number, @Query('mode') mode?: string, @Query('status') status?: string) { return this.service.findAll(page, limit, mode, status); }

    @Get(':id') @ApiOperation({ summary: 'Get route by ID' })
    findOne(@Param('id') id: string) { return this.service.findOne(id); }

    @Patch(':id') @ApiOperation({ summary: 'Update route' })
    update(@Param('id') id: string, @Body() dto: UpdateRouteDto) { return this.service.update(id, dto); }

    @Delete(':id') @ApiOperation({ summary: 'Delete route' })
    remove(@Param('id') id: string) { return this.service.remove(id); }
}
