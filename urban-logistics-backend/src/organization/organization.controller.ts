import { Controller, Get, Post, Patch, Delete, Param, ParseIntPipe, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { OrganizationService } from './organization.service';
import { CreateOrganizationDto, UpdateOrganizationDto } from './dto';
import { JwtAuthGuard } from '../common/guards';

@Controller('organizations')
@ApiTags('organizations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class OrganizationController {
    constructor(private readonly service: OrganizationService) { }

    @Post()
    @ApiOperation({ summary: 'Create organization' })
    create(@Body() createDto: CreateOrganizationDto) {
        return this.service.create(createDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all organizations' })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    @ApiQuery({ name: 'type', required: false })
    findAll(@Query('page') page?: number, @Query('limit') limit?: number, @Query('type') type?: string) {
        return this.service.findAll(page, limit, type);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get organization by ID' })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.service.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update organization' })
    update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateOrganizationDto) {
        return this.service.update(id, updateDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete organization' })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.service.remove(id);
    }
}
