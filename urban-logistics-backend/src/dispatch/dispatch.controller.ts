import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards';
import { AssignLegDto } from './dto/assign-leg.dto';
import { BatchAssignLegsDto } from './dto/batch-assign-legs.dto';
import { DispatchService } from './dispatch.service';

@ApiTags('dispatch')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dispatch')
export class DispatchController {
    constructor(private readonly dispatchService: DispatchService) {}

    @Get('unassigned-legs')
    @ApiOperation({ summary: 'Leg chưa gán xe / tài xế (gom đơn & điều phối)' })
    unassignedLegs() {
        return this.dispatchService.unassignedLegs();
    }

    @Get('assignments/recent')
    @ApiOperation({ summary: 'Phân công gần đây (sau điều phối — xem xe / tài xế / TRK)' })
    recentAssignments(@Query('limit') limit?: string) {
        return this.dispatchService.recentAssignments(limit ? Number(limit) : 40);
    }

    @Post('orders/:orderId/enqueue')
    @ApiOperation({ summary: 'Tạo shipment + leg chưa gán cho đơn (đơn cũ / thiếu chặng)' })
    enqueueOrder(@Param('orderId') orderId: string) {
        return this.dispatchService.enqueueOrder(orderId);
    }

    @Post('assign')
    @ApiOperation({ summary: 'Gán một leg cho xe (và tùy chọn tài xế)' })
    assign(@Body() dto: AssignLegDto) {
        return this.dispatchService.assign(dto);
    }

    @Post('batch-assign')
    @ApiOperation({ summary: 'Gom nhiều leg — gán cùng một xe / tài xế' })
    batchAssign(@Body() dto: BatchAssignLegsDto) {
        return this.dispatchService.batchAssign(dto);
    }

    @Post('suggest-vehicle/:legId')
    @ApiOperation({ summary: 'Gợi ý xe gần điểm lấy hàng' })
    suggest(@Param('legId') legId: string) {
        return this.dispatchService.suggestVehicleForLeg(legId);
    }
}
