import { Controller, Get, Post, Patch, Delete, Param, ParseIntPipe, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { RouteService } from './route.service';
import { CreateRouteFromOrdersDto, OptimizeStopsDto, UpdateRouteDto } from './dto';
import { SuggestFacilitiesDto } from './dto/suggest-facilities.dto';
import { DrivingSegmentDto } from './dto/driving-segment.dto';
import { JwtAuthGuard } from '../common/guards';

@Controller('routes')
@ApiTags('routes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class RouteController {
    constructor(private readonly service: RouteService) { }

    @Post() @ApiOperation({ summary: 'Gom nhiều order thành 1 route (xe + shipper + ca)' })
    create(@Body() dto: CreateRouteFromOrdersDto) { return this.service.createRouteFromOrders(dto); }

    @Get('unassigned-orders') @ApiOperation({ summary: 'Đơn chưa gom vào route (theo carrier/zone)' })
    @ApiQuery({ name: 'carrierId', required: true }) @ApiQuery({ name: 'zoneId', required: false })
    unassignedOrders(@Query('carrierId') carrierId: string, @Query('zoneId') zoneId?: string) {
        return this.service.unassignedOrders(Number(carrierId), zoneId ? Number(zoneId) : undefined);
    }

    @Get('suggest-vehicle-shipper') @ApiOperation({ summary: 'Gợi ý xe + shipper đang rảnh cho zone' })
    @ApiQuery({ name: 'carrierId', required: true }) @ApiQuery({ name: 'zoneId', required: false })
    suggestVehicleShipper(@Query('carrierId') carrierId: string, @Query('zoneId') zoneId?: string) {
        return this.service.suggestVehicleAndShipperForZone(Number(carrierId), zoneId ? Number(zoneId) : undefined);
    }

    @Post('optimize-stops') @ApiOperation({ summary: 'Tối ưu thứ tự điểm (nearest-neighbor / VRP-lite)' })
    optimizeStops(@Body() dto: OptimizeStopsDto) { return this.service.optimizeStopSequence(dto.points); }

    @Post('suggest-facilities') @ApiOperation({ summary: 'Gợi ý kho/hub gần tuyến lái xe tối ưu (Mapbox + buffer)' })
    suggestFacilities(@Body() dto: SuggestFacilitiesDto) { return this.service.suggestFacilitiesAlongRoute(dto); }

    @Post('driving-segment') @ApiOperation({ summary: 'Một đoạn lái xe, tránh chồng lấp với đoạn cấm (phương án Mapbox)' })
    drivingSegment(@Body() dto: DrivingSegmentDto) { return this.service.drivingSegmentAvoidingRestrictions(dto); }

    @Get() @ApiOperation({ summary: 'Danh sách route' })
    @ApiQuery({ name: 'page', required: false }) @ApiQuery({ name: 'limit', required: false }) @ApiQuery({ name: 'carrierId', required: false }) @ApiQuery({ name: 'status', required: false }) @ApiQuery({ name: 'shipperId', required: false })
    findAll(
        @Query('page') page?: number,
        @Query('limit') limit?: number,
        @Query('carrierId') carrierId?: string,
        @Query('status') status?: string,
        @Query('shipperId') shipperId?: string,
    ) { return this.service.findAll(page, limit, carrierId, status, shipperId); }

    @Get(':id') @ApiOperation({ summary: 'Chi tiết route' })
    findOne(@Param('id', ParseIntPipe) id: number) { return this.service.findOne(id); }

    @Patch(':id') @ApiOperation({ summary: 'Cập nhật route' })
    update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRouteDto) { return this.service.update(id, dto); }

    @Delete(':id') @ApiOperation({ summary: 'Xóa route' })
    remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }
}
