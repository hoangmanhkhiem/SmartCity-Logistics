import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CarrierService } from './carrier.service';
import { CreateCarrierDto, UpdateCarrierDto } from './dto';
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

    @Get(':id') @ApiOperation({ summary: 'Get carrier by ID' })
    findOne(@Param('id') id: string) { return this.service.findOne(id); }

    @Patch(':id') @ApiOperation({ summary: 'Update carrier' })
    update(@Param('id') id: string, @Body() dto: UpdateCarrierDto) { return this.service.update(id, dto); }

    @Delete(':id') @ApiOperation({ summary: 'Delete carrier' })
    remove(@Param('id') id: string) { return this.service.remove(id); }
}
