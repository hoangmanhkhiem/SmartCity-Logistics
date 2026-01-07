import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { OrderService } from './order.service';
import { CreateOrderDto, UpdateOrderDto } from './dto';
import { JwtAuthGuard } from '../common/guards';

@Controller('orders')
@ApiTags('orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class OrderController {
    constructor(private readonly service: OrderService) { }

    @Post() @ApiOperation({ summary: 'Create order' })
    create(@Body() dto: CreateOrderDto) { return this.service.create(dto); }

    @Get() @ApiOperation({ summary: 'Get all orders' })
    @ApiQuery({ name: 'page', required: false }) @ApiQuery({ name: 'limit', required: false }) @ApiQuery({ name: 'status', required: false }) @ApiQuery({ name: 'customerId', required: false })
    findAll(@Query('page') page?: number, @Query('limit') limit?: number, @Query('status') status?: string, @Query('customerId') cId?: string) { return this.service.findAll(page, limit, status, cId); }

    @Get(':id') @ApiOperation({ summary: 'Get order by ID' })
    findOne(@Param('id') id: string) { return this.service.findOne(id); }

    @Patch(':id') @ApiOperation({ summary: 'Update order' })
    update(@Param('id') id: string, @Body() dto: UpdateOrderDto) { return this.service.update(id, dto); }

    @Delete(':id') @ApiOperation({ summary: 'Delete order' })
    remove(@Param('id') id: string) { return this.service.remove(id); }
}
