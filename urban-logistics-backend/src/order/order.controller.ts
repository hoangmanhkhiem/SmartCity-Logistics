import { Controller, Get, Post, Patch, Delete, Param, ParseIntPipe, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { OrderService } from './order.service';
import { CreateOrderDto, UpdateOrderDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { Roles } from '../common/decorators';

@Controller('orders')
@ApiTags('orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrderController {
    constructor(private readonly service: OrderService) { }

    @Post() @Roles('platform_admin', 'carrier_ops', 'consumer') @ApiOperation({ summary: 'Create order' })
    create(@Body() dto: CreateOrderDto) { return this.service.create(dto); }

    @Get() @ApiOperation({ summary: 'Get all orders' })
    @ApiQuery({ name: 'page', required: false }) @ApiQuery({ name: 'limit', required: false }) @ApiQuery({ name: 'status', required: false }) @ApiQuery({ name: 'customerId', required: false }) @ApiQuery({ name: 'carrierId', required: false }) @ApiQuery({ name: 'zoneId', required: false })
    findAll(
        @Query('page') page?: number,
        @Query('limit') limit?: number,
        @Query('status') status?: string,
        @Query('customerId') cId?: string,
        @Query('carrierId') carrierId?: string,
        @Query('zoneId') zoneId?: string,
    ) { return this.service.findAll(page, limit, status, cId, carrierId, zoneId); }

    @Get(':id') @ApiOperation({ summary: 'Get order by ID' })
    findOne(@Param('id', ParseIntPipe) id: number) { return this.service.findOne(id); }

    @Patch(':id') @Roles('platform_admin', 'carrier_ops') @ApiOperation({ summary: 'Update order' })
    update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateOrderDto) { return this.service.update(id, dto); }

    @Delete(':id') @Roles('platform_admin', 'carrier_ops') @ApiOperation({ summary: 'Delete order' })
    remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }
}
