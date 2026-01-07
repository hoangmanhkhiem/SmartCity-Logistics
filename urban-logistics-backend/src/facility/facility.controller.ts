import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { FacilityService } from './facility.service';
import { CreateFacilityDto, UpdateFacilityDto } from './dto';
import { JwtAuthGuard } from '../common/guards';

@Controller('facilities')
@ApiTags('facilities')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class FacilityController {
    constructor(private readonly service: FacilityService) { }

    @Post() @ApiOperation({ summary: 'Create facility' })
    create(@Body() dto: CreateFacilityDto) { return this.service.create(dto); }

    @Get() @ApiOperation({ summary: 'Get all facilities' })
    @ApiQuery({ name: 'page', required: false }) @ApiQuery({ name: 'limit', required: false }) @ApiQuery({ name: 'organizationId', required: false }) @ApiQuery({ name: 'kind', required: false }) @ApiQuery({ name: 'zoneId', required: false })
    findAll(@Query('page') page?: number, @Query('limit') limit?: number, @Query('organizationId') orgId?: string, @Query('kind') kind?: string, @Query('zoneId') zoneId?: string) { return this.service.findAll(page, limit, orgId, kind, zoneId); }

    @Get(':id') @ApiOperation({ summary: 'Get facility by ID' })
    findOne(@Param('id') id: string) { return this.service.findOne(id); }

    @Patch(':id') @ApiOperation({ summary: 'Update facility' })
    update(@Param('id') id: string, @Body() dto: UpdateFacilityDto) { return this.service.update(id, dto); }

    @Delete(':id') @ApiOperation({ summary: 'Delete facility' })
    remove(@Param('id') id: string) { return this.service.remove(id); }
}
