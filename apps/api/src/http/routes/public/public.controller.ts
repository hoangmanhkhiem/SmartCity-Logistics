import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Public } from '../../middlewares/decorators';
import { PublicService } from './public.service';

@Controller('public')
@ApiTags('public')
@Public()
export class PublicController {
    constructor(private readonly service: PublicService) {}

    @Get('map-layers')
    @ApiOperation({ summary: 'FR19.2 — Lớp bản đồ công khai (đã verified)' })
    mapLayers() {
        return this.service.mapLayers();
    }

    @Get('zone-kpi')
    @ApiOperation({ summary: 'FR19.3 — Chỉ số logistics theo vùng (k-anonymity n≥5)' })
    zoneKpi() {
        return this.service.zoneKpi();
    }

    @Get('facilities')
    @ApiOperation({ summary: 'FR1.1 — Facility công khai theo bbox hoặc near' })
    @ApiQuery({ name: 'minLat', required: false })
    @ApiQuery({ name: 'maxLat', required: false })
    @ApiQuery({ name: 'minLon', required: false })
    @ApiQuery({ name: 'maxLon', required: false })
    @ApiQuery({ name: 'lat', required: false })
    @ApiQuery({ name: 'lon', required: false })
    @ApiQuery({ name: 'radiusKm', required: false })
    @ApiQuery({ name: 'kind', required: false })
    @ApiQuery({ name: 'limit', required: false })
    facilities(
        @Query('minLat') minLat?: string,
        @Query('maxLat') maxLat?: string,
        @Query('minLon') minLon?: string,
        @Query('maxLon') maxLon?: string,
        @Query('lat') lat?: string,
        @Query('lon') lon?: string,
        @Query('radiusKm') radiusKm?: string,
        @Query('kind') kind?: string,
        @Query('limit') limit?: string,
    ) {
        return this.service.facilitiesNear({
            minLat: minLat != null ? Number(minLat) : undefined,
            maxLat: maxLat != null ? Number(maxLat) : undefined,
            minLon: minLon != null ? Number(minLon) : undefined,
            maxLon: maxLon != null ? Number(maxLon) : undefined,
            lat: lat != null ? Number(lat) : undefined,
            lon: lon != null ? Number(lon) : undefined,
            radiusKm: radiusKm != null ? Number(radiusKm) : undefined,
            kind,
            limit: limit != null ? Number(limit) : undefined,
        });
    }
}
