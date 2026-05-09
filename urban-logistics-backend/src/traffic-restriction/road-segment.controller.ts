import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { Roles } from '../common/decorators';
import { RoadSegmentService } from './road-segment.service';
import { CreateRoadSegmentDto, UpdateRoadSegmentDto } from './dto';

@Controller('road-segments')
@ApiTags('road-segments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'regulator')
export class RoadSegmentController {
    constructor(private readonly service: RoadSegmentService) { }

    @Post()
    @ApiOperation({ summary: 'Tạo đoạn đường (geometry GeoJSON LineString)' })
    create(@Body() dto: CreateRoadSegmentDto) {
        return this.service.create(dto);
    }

    @Get()
    @ApiOperation({ summary: 'Danh sách đoạn đường' })
    @ApiQuery({ name: 'zoneId', required: false })
    @ApiQuery({ name: 'includeInactive', required: false })
    findAll(@Query('zoneId') zoneId?: string, @Query('includeInactive') includeInactive?: boolean) {
        return this.service.findAll(zoneId, Boolean(includeInactive));
    }

    @Get(':id')
    @ApiOperation({ summary: 'Chi tiết đoạn đường' })
    findOne(@Param('id') id: string) {
        return this.service.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Cập nhật đoạn đường' })
    update(@Param('id') id: string, @Body() dto: UpdateRoadSegmentDto) {
        return this.service.update(id, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Xóa đoạn đường' })
    remove(@Param('id') id: string) {
        return this.service.remove(id);
    }
}
