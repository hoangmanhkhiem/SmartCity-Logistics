import { Controller, Get, Post, Patch, Delete, Param, ParseIntPipe, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { FacilityService } from './facility.service';
import { CreateFacilityDto, UpdateFacilityDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { Roles } from '../common/decorators';

@Controller('facilities')
@ApiTags('facilities')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class FacilityController {
    constructor(private readonly service: FacilityService) { }

    @Post() @Roles('platform_admin', 'carrier_ops') @ApiOperation({ summary: 'Create facility' })
    create(@Body() dto: CreateFacilityDto) { return this.service.create(dto); }

    @Get() @ApiOperation({ summary: 'Get all facilities' })
    @ApiQuery({ name: 'page', required: false }) @ApiQuery({ name: 'limit', required: false }) @ApiQuery({ name: 'organizationId', required: false }) @ApiQuery({ name: 'kind', required: false }) @ApiQuery({ name: 'zoneId', required: false })
    findAll(@Query('page') page?: number, @Query('limit') limit?: number, @Query('organizationId') orgId?: string, @Query('kind') kind?: string, @Query('zoneId') zoneId?: string) { return this.service.findAll(page, limit, orgId, kind, zoneId); }

    @Get(':id') @ApiOperation({ summary: 'Get facility by ID' })
    findOne(@Param('id', ParseIntPipe) id: number) { return this.service.findOne(id); }

    @Patch(':id') @Roles('platform_admin', 'carrier_ops') @ApiOperation({ summary: 'Update facility' })
    update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateFacilityDto) { return this.service.update(id, dto); }

    @Delete(':id') @Roles('platform_admin', 'carrier_ops') @ApiOperation({ summary: 'Delete facility' })
    remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }
}
