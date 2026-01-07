import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { RouteService } from './route.service';
import { CreateRouteDto, UpdateRouteDto } from './dto';
import { JwtAuthGuard } from '../common/guards';

@Controller('routes')
@ApiTags('routes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class RouteController {
    constructor(private readonly service: RouteService) { }

    @Post() @ApiOperation({ summary: 'Create route' })
    create(@Body() dto: CreateRouteDto) { return this.service.create(dto); }

    @Get() @ApiOperation({ summary: 'Get all routes' })
    @ApiQuery({ name: 'page', required: false }) @ApiQuery({ name: 'limit', required: false }) @ApiQuery({ name: 'mode', required: false }) @ApiQuery({ name: 'status', required: false })
    findAll(@Query('page') page?: number, @Query('limit') limit?: number, @Query('mode') mode?: string, @Query('status') status?: string) { return this.service.findAll(page, limit, mode, status); }

    @Get(':id') @ApiOperation({ summary: 'Get route by ID' })
    findOne(@Param('id') id: string) { return this.service.findOne(id); }

    @Patch(':id') @ApiOperation({ summary: 'Update route' })
    update(@Param('id') id: string, @Body() dto: UpdateRouteDto) { return this.service.update(id, dto); }

    @Delete(':id') @ApiOperation({ summary: 'Delete route' })
    remove(@Param('id') id: string) { return this.service.remove(id); }
}
