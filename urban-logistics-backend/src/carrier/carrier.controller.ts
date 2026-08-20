import { Controller, Get, Post, Patch, Delete, Param, ParseIntPipe, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CarrierService } from './carrier.service';
import { CreateCarrierDto, UpdateCarrierDto, UpdateCarrierZonesDto } from './dto';
import { JwtAuthGuard } from '../common/guards';

@Controller('carriers')
@ApiTags('carriers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class CarrierController {
    constructor(private readonly service: CarrierService) { }

    @Post() @ApiOperation({ summary: 'Create carrier' })
    create(@Body() dto: CreateCarrierDto) { return this.service.create(dto); }

    @Get() @ApiOperation({ summary: 'Get all carriers' })
    @ApiQuery({ name: 'page', required: false }) @ApiQuery({ name: 'limit', required: false }) @ApiQuery({ name: 'organizationId', required: false })
    findAll(@Query('page') page?: number, @Query('limit') limit?: number, @Query('organizationId') orgId?: string) { return this.service.findAll(page, limit, orgId); }

    @Get('compare') @ApiOperation({ summary: 'So sánh phí ước tính giữa các carrier phục vụ khu vực điểm giao' })
    @ApiQuery({ name: 'pickupLat', required: true }) @ApiQuery({ name: 'pickupLon', required: true })
    @ApiQuery({ name: 'deliveryLat', required: true }) @ApiQuery({ name: 'deliveryLon', required: true })
    @ApiQuery({ name: 'weightKg', required: false })
    compare(
        @Query('pickupLat') pickupLat: string,
        @Query('pickupLon') pickupLon: string,
        @Query('deliveryLat') deliveryLat: string,
        @Query('deliveryLon') deliveryLon: string,
        @Query('weightKg') weightKg?: string,
    ) {
        return this.service.compareForRoute({
            pickupLat: Number(pickupLat),
            pickupLon: Number(pickupLon),
            deliveryLat: Number(deliveryLat),
            deliveryLon: Number(deliveryLon),
            weightKg: weightKg ? Number(weightKg) : undefined,
        });
    }

    @Get(':id') @ApiOperation({ summary: 'Get carrier by ID' })
    findOne(@Param('id', ParseIntPipe) id: number) { return this.service.findOne(id); }

    @Patch(':id') @ApiOperation({ summary: 'Update carrier' })
    update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCarrierDto) { return this.service.update(id, dto); }

    @Delete(':id') @ApiOperation({ summary: 'Delete carrier' })
    remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }

    @Patch(':id/zones') @ApiOperation({ summary: 'Gán khu vực hoạt động cho carrier' })
    updateZones(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCarrierZonesDto) { return this.service.updateZones(id, dto); }
}
