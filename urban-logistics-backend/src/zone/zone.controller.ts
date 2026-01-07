import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ZoneService } from './zone.service';
import { CreateZoneDto, UpdateZoneDto } from './dto';
import { JwtAuthGuard } from '../common/guards';

@Controller('zones')
@ApiTags('zones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class ZoneController {
    constructor(private readonly service: ZoneService) { }

    @Post() @ApiOperation({ summary: 'Create zone' })
    create(@Body() dto: CreateZoneDto) { return this.service.create(dto); }

    @Get() @ApiOperation({ summary: 'Get all zones' })
    @ApiQuery({ name: 'page', required: false }) @ApiQuery({ name: 'limit', required: false }) @ApiQuery({ name: 'type', required: false })
    findAll(@Query('page') page?: number, @Query('limit') limit?: number, @Query('type') type?: string) { return this.service.findAll(page, limit, type); }

    @Get(':id') @ApiOperation({ summary: 'Get zone by ID' })
    findOne(@Param('id') id: string) { return this.service.findOne(id); }

    @Patch(':id') @ApiOperation({ summary: 'Update zone' })
    update(@Param('id') id: string, @Body() dto: UpdateZoneDto) { return this.service.update(id, dto); }

    @Delete(':id') @ApiOperation({ summary: 'Delete zone' })
    remove(@Param('id') id: string) { return this.service.remove(id); }
}
