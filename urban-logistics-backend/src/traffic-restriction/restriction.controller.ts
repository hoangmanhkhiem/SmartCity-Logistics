import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { Roles } from '../common/decorators';
import { RestrictionService } from './restriction.service';
import { CreateRestrictionDto, UpdateRestrictionDto } from './dto';

@Controller('restrictions')
@ApiTags('restrictions')
export class RestrictionController {
    constructor(private readonly service: RestrictionService) { }

    @Get('active/geojson')
    @ApiOperation({
        summary: 'GeoJSON các tuyến hạn chế đang hiệu lực tại thời điểm (bản đồ)',
    })
    @ApiQuery({ name: 'at', required: false, description: 'ISO 8601 — mặc định hiện tại' })
    @ApiQuery({ name: 'vehicleType', required: false, description: 'vd truck, van — lọc theo loại xe' })
    async activeGeoJson(
        @Query('at') atRaw?: string,
        @Query('vehicleType') vehicleType?: string,
    ) {
        const at = atRaw ? new Date(atRaw) : new Date();
        if (Number.isNaN(at.getTime())) {
            return { type: 'FeatureCollection' as const, features: [] };
        }
        return this.service.findActiveAsGeoJson(at, vehicleType);
    }

    @Post()
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'regulator')
    @ApiOperation({ summary: 'Tạo quy định hạn chế' })
    create(@Body() dto: CreateRestrictionDto) {
        return this.service.create(dto);
    }

    @Get()
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'regulator')
    @ApiOperation({ summary: 'Danh sách quy định' })
    findAll() {
        return this.service.findAll();
    }

    @Get(':id')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'regulator')
    @ApiOperation({ summary: 'Chi tiết quy định' })
    findOne(@Param('id') id: string) {
        return this.service.findOne(id);
    }

    @Patch(':id')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'regulator')
    @ApiOperation({ summary: 'Cập nhật quy định' })
    update(@Param('id') id: string, @Body() dto: UpdateRestrictionDto) {
        return this.service.update(id, dto);
    }

    @Delete(':id')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'regulator')
    @ApiOperation({ summary: 'Xóa quy định' })
    remove(@Param('id') id: string) {
        return this.service.remove(id);
    }
}
