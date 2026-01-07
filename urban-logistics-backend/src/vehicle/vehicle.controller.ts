import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { VehicleService } from './vehicle.service';
import { CreateVehicleDto, UpdateVehicleDto } from './dto';
import { JwtAuthGuard } from '../common/guards';

@Controller('vehicles')
@ApiTags('vehicles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class VehicleController {
    constructor(private readonly service: VehicleService) { }

    @Post() @ApiOperation({ summary: 'Create vehicle' })
    create(@Body() dto: CreateVehicleDto) { return this.service.create(dto); }

    @Get() @ApiOperation({ summary: 'Get all vehicles' })
    @ApiQuery({ name: 'page', required: false }) @ApiQuery({ name: 'limit', required: false }) @ApiQuery({ name: 'carrierId', required: false }) @ApiQuery({ name: 'type', required: false })
    findAll(@Query('page') page?: number, @Query('limit') limit?: number, @Query('carrierId') cId?: string, @Query('type') type?: string) { return this.service.findAll(page, limit, cId, type); }

    @Get(':id') @ApiOperation({ summary: 'Get vehicle by ID' })
    findOne(@Param('id') id: string) { return this.service.findOne(id); }

    @Patch(':id') @ApiOperation({ summary: 'Update vehicle' })
    update(@Param('id') id: string, @Body() dto: UpdateVehicleDto) { return this.service.update(id, dto); }

    @Delete(':id') @ApiOperation({ summary: 'Delete vehicle' })
    remove(@Param('id') id: string) { return this.service.remove(id); }
}
