import { Body, Controller, ForbiddenException, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { CurrentUser, Roles } from '../common/decorators';
import { ShippersService } from './shippers.service';
import { ClockInDto, CompleteStopDto, CreateShipperProfileDto, FailStopDto } from './dto/shipper.dto';

@ApiTags('shippers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('shippers')
export class ShippersController {
    constructor(private readonly shippersService: ShippersService) { }

    @Get()
    @Roles('platform_admin', 'carrier_ops')
    @ApiOperation({ summary: 'Danh sách shipper (theo carrier)' })
    list(@Query('carrierId') carrierId?: string) {
        return this.shippersService.listShippers(carrierId ? Number(carrierId) : undefined);
    }

    @Post()
    @Roles('platform_admin', 'carrier_ops')
    @ApiOperation({ summary: 'Tạo hồ sơ shipper cho user' })
    createProfile(@Body() dto: CreateShipperProfileDto) {
        return this.shippersService.createProfile(dto);
    }

    @Get(':userId/stats')
    @ApiOperation({ summary: 'Hiệu suất / route gần đây của shipper (chính mình, hoặc platform_admin/carrier_ops)' })
    stats(
        @Param('userId', ParseIntPipe) userId: number,
        @CurrentUser() currentUser: { id: number; memberships?: { role: { name: string } }[] },
    ) {
        const isSelf = currentUser.id === userId;
        const isOps = currentUser.memberships?.some((m) => ['platform_admin', 'carrier_ops'].includes(m.role.name));
        if (!isSelf && !isOps) throw new ForbiddenException('Không có quyền xem hiệu suất của shipper này');
        return this.shippersService.shipperStats(userId);
    }

    @Post(':userId/clock-in')
    @ApiOperation({ summary: 'Bắt đầu ca — chọn xe (chính mình, hoặc platform_admin/carrier_ops)' })
    clockIn(
        @Param('userId', ParseIntPipe) userId: number,
        @Body() dto: ClockInDto,
        @CurrentUser() currentUser: { id: number; memberships?: { role: { name: string } }[] },
    ) {
        const isSelf = currentUser.id === userId;
        const isOps = currentUser.memberships?.some((m) => ['platform_admin', 'carrier_ops'].includes(m.role.name));
        if (!isSelf && !isOps) throw new ForbiddenException('Không có quyền chấm công cho shipper này');
        return this.shippersService.clockIn(userId, dto);
    }

    @Post(':userId/clock-out')
    @ApiOperation({ summary: 'Kết thúc ca (chính mình, hoặc platform_admin/carrier_ops)' })
    clockOut(
        @Param('userId', ParseIntPipe) userId: number,
        @CurrentUser() currentUser: { id: number; memberships?: { role: { name: string } }[] },
    ) {
        const isSelf = currentUser.id === userId;
        const isOps = currentUser.memberships?.some((m) => ['platform_admin', 'carrier_ops'].includes(m.role.name));
        if (!isSelf && !isOps) throw new ForbiddenException('Không có quyền chấm công cho shipper này');
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
