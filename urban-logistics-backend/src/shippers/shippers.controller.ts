import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards';
import { CurrentUser } from '../common/decorators';
import { ShippersService } from './shippers.service';
import { ClockInDto, CompleteStopDto, CreateShipperProfileDto, FailStopDto } from './dto/shipper.dto';

@ApiTags('shippers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('shippers')
export class ShippersController {
    constructor(private readonly shippersService: ShippersService) { }

    @Get()
    @ApiOperation({ summary: 'Danh sách shipper (theo carrier)' })
    list(@Query('carrierId') carrierId?: string) {
        return this.shippersService.listShippers(carrierId ? Number(carrierId) : undefined);
    }

    @Post()
    @ApiOperation({ summary: 'Tạo hồ sơ shipper cho user' })
    createProfile(@Body() dto: CreateShipperProfileDto) {
        return this.shippersService.createProfile(dto);
    }

    @Get(':userId/stats')
    @ApiOperation({ summary: 'Hiệu suất / route gần đây của shipper' })
    stats(@Param('userId', ParseIntPipe) userId: number) {
        return this.shippersService.shipperStats(userId);
    }

    @Post(':userId/clock-in')
    @ApiOperation({ summary: 'Bắt đầu ca — chọn xe' })
    clockIn(@Param('userId', ParseIntPipe) userId: number, @Body() dto: ClockInDto) {
        return this.shippersService.clockIn(userId, dto);
    }

    @Post(':userId/clock-out')
    @ApiOperation({ summary: 'Kết thúc ca' })
    clockOut(@Param('userId', ParseIntPipe) userId: number) {
        return this.shippersService.clockOut(userId);
    }

    // ==================== Self-service ====================

    @Get('me/routes/today')
    @ApiOperation({ summary: 'Route hôm nay của shipper hiện tại' })
    getTodayRoute(@CurrentUser('id') userId: number) {
        return this.shippersService.getTodayRoute(userId);
    }

    @Get('me/routes/:routeId')
    @ApiOperation({ summary: 'Chi tiết route của shipper hiện tại' })
    getRoute(@CurrentUser('id') userId: number, @Param('routeId', ParseIntPipe) routeId: number) {
        return this.shippersService.getRouteForShipper(userId, routeId);
    }

    @Get('me/routes/:routeId/directions')
    @ApiOperation({ summary: 'Chỉ đường (né đoạn cấm) tới điểm dừng kế tiếp' })
    getDirections(@CurrentUser('id') userId: number, @Param('routeId', ParseIntPipe) routeId: number) {
        return this.shippersService.getDirectionsToNextStop(userId, routeId);
    }

    @Patch('me/routes/:routeId/start')
    @ApiOperation({ summary: 'Bắt đầu chuyến' })
    startRoute(@CurrentUser('id') userId: number, @Param('routeId', ParseIntPipe) routeId: number) {
        return this.shippersService.startRoute(userId, routeId);
    }

    @Patch('me/routes/:routeId/complete')
    @ApiOperation({ summary: 'Hoàn tất chuyến' })
    completeRoute(@CurrentUser('id') userId: number, @Param('routeId', ParseIntPipe) routeId: number) {
        return this.shippersService.completeRoute(userId, routeId);
    }

    @Patch('me/stops/:stopId/arrive')
    @ApiOperation({ summary: 'Xác nhận đã đến điểm dừng' })
    arriveStop(@CurrentUser('id') userId: number, @Param('stopId', ParseIntPipe) stopId: number) {
        return this.shippersService.arriveStop(userId, stopId);
    }

    @Patch('me/stops/:stopId/complete')
    @ApiOperation({ summary: 'Hoàn thành điểm dừng (POD/COD)' })
    completeStop(
        @CurrentUser('id') userId: number,
        @Param('stopId', ParseIntPipe) stopId: number,
        @Body() dto: CompleteStopDto,
    ) {
        return this.shippersService.completeStop(userId, stopId, dto);
    }

    @Patch('me/stops/:stopId/fail')
    @ApiOperation({ summary: 'Báo giao thất bại' })
    failStop(
        @CurrentUser('id') userId: number,
        @Param('stopId', ParseIntPipe) stopId: number,
        @Body() dto: FailStopDto,
    ) {
        return this.shippersService.failStop(userId, stopId, dto);
    }
}
