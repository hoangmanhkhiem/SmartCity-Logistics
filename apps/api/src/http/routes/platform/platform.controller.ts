import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard } from '../../middlewares/guards';
import { Public, Roles } from '../../middlewares/decorators';
import { PlatformService } from './platform.service';

@Controller()
@ApiTags('platform')
export class PlatformController {
    constructor(private readonly platform: PlatformService) {}

    @Get('emission-factors')
    @Public()
    @ApiOperation({ summary: 'FR3.2 — hệ số phát thải gCO2e/km' })
    factors() {
        return this.platform.listFactors();
    }

    @Post('emission-factors')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('platform_admin', 'sys_admin', 'regulator')
    @ApiOperation({ summary: 'Thêm hệ số phát thải' })
    createFactor(@Body() body: { vehicleType: string; fuelType: string; gCo2ePerKm: number; sourceRef?: string }) {
        return this.platform.createFactor(body);
    }

    @Patch('emission-factors/:id')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('platform_admin', 'sys_admin', 'regulator')
    @ApiOperation({ summary: 'Cập nhật hệ số phát thải gCO2e/km' })
    updateFactor(@Param('id', ParseIntPipe) id: number, @Body() body: { vehicleType?: string; fuelType?: string; gCo2ePerKm?: number; sourceRef?: string }) {
        return this.platform.updateFactor(id, body);
    }

    @Delete('emission-factors/:id')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('platform_admin', 'sys_admin')
    @ApiOperation({ summary: 'Xóa hệ số phát thải' })
    deleteFactor(@Param('id', ParseIntPipe) id: number) {
        return this.platform.deleteFactor(id);
    }

    @Get('geocode')
    @Public()
    @ApiOperation({ summary: 'Tìm địa chỉ qua Mapbox Geocoding (proxy). Không dùng Google.' })
    geocode(@Query('q') q = '') {
        return this.platform.geocode(q);
    }

    @Get('issues')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('researcher', 'sys_admin', 'platform_admin', 'regulator')
    listIssues() {
        return this.platform.listIssues();
    }

    @Patch('issues/:id')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('researcher', 'sys_admin', 'platform_admin', 'regulator')
    updateIssue(@Param('id', ParseIntPipe) id: number, @Body() body: { issueType?: string; note?: string; status?: string }) {
        return this.platform.updateIssue(id, body);
    }

    @Delete('issues/:id')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('researcher', 'sys_admin', 'platform_admin')
    deleteIssue(@Param('id', ParseIntPipe) id: number) {
        return this.platform.deleteIssue(id);
    }

    @Post('issues')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'FR13.4 — báo điểm nghẽn (vị trí làm mờ trước khi lưu)' })
    issue(@Body() body: { issueType: string; latitude: number; longitude: number; zoneId?: number; note?: string }, @Req() req: { user: { id: number } }) {
        return this.platform.reportIssue(req.user.id, body);
    }

    @Patch('issues/:id/review')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('researcher', 'sys_admin', 'platform_admin', 'regulator')
    reviewIssue(@Param('id', ParseIntPipe) id: number, @Body() body: { status: 'approved' | 'rejected' }) {
        return this.platform.reviewIssue(id, body.status);
    }

    @Get('bottlenecks')
    @Public()
    @ApiOperation({ summary: 'FR13.1 — điểm nghẽn đã duyệt' })
    bottlenecks(@Query('type') type?: string) {
        return this.platform.bottlenecks(type);
    }

    @Get('plans')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('org_staff', 'dispatcher', 'carrier_ops', 'researcher', 'platform_admin', 'sys_admin')
    listPlans() {
        return this.platform.listPlans();
    }

    @Post('plans')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('org_staff', 'dispatcher', 'carrier_ops', 'researcher', 'member')
    @ApiOperation({ summary: 'FR5.1 — lập kế hoạch tuyến, trả job_id' })
    plan(@Body() body: Record<string, unknown>, @Req() req: { user: { memberships?: { organizationId: number }[] } }) {
        const orgId = req.user.memberships?.[0]?.organizationId ?? null;
        return this.platform.createPlan(orgId, body);
    }

    @Get('plans/:id')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    planOne(@Param('id', ParseIntPipe) id: number) {
        return this.platform.getPlan(id);
    }

    @Patch('plans/:id')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('org_staff', 'carrier_ops', 'platform_admin', 'sys_admin', 'researcher')
    updatePlan(@Param('id', ParseIntPipe) id: number, @Body() body: { status?: string }) {
        return this.platform.updatePlan(id, body);
    }

    @Delete('plans/:id')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('platform_admin', 'sys_admin', 'carrier_ops')
    deletePlan(@Param('id', ParseIntPipe) id: number) {
        return this.platform.deletePlan(id);
    }

    @Get('scenarios')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('regulator', 'researcher', 'sys_admin', 'platform_admin')
    listScenarios() {
        return this.platform.listScenarios();
    }

    @Post('scenarios')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('regulator', 'researcher', 'sys_admin', 'platform_admin', 'member')
    @ApiOperation({ summary: 'FR18 — kịch bản chính sách' })
    scenario(@Body() body: { name: string; kind?: string; changes?: Record<string, unknown> }) {
        return this.platform.createScenario(body.name, body.kind ?? 'policy', body.changes ?? {});
    }

    @Get('scenarios/:id/result')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    scenarioOne(@Param('id', ParseIntPipe) id: number) {
        return this.platform.getScenario(id);
    }

    @Patch('scenarios/:id')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('regulator', 'researcher', 'sys_admin', 'platform_admin')
    updateScenario(@Param('id', ParseIntPipe) id: number, @Body() body: { name?: string; kind?: string }) {
        return this.platform.updateScenario(id, body);
    }

    @Delete('scenarios/:id')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('regulator', 'sys_admin', 'platform_admin')
    deleteScenario(@Param('id', ParseIntPipe) id: number) {
        return this.platform.deleteScenario(id);
    }

    @Get('jobs/:id')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    job(@Param('id', ParseIntPipe) id: number) {
        return this.platform.getJob(id);
    }

    @Post('ingest/demand')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'FR20.4 — số đơn tổng hợp phường × giờ' })
    demand(@Body() body: { rows: Array<{ organizationId?: number; zoneId: number; hourBucket: string; orderType: string; orderCount: number }> }) {
        return this.platform.upsertDemand(body.rows ?? []);
    }

    @Get('profiles/operation')
    @Public()
    @ApiOperation({ summary: 'FR16.1 — hồ sơ vận hành (mẫu)' })
    operation() {
        return [{ platform: 'mixed', orderType: 'express', vehicleType: 'motorbike_ev', nResponses: 0, note: 'Điền sau khi duyệt phiếu khảo sát' }];
    }

    @Get('profiles/peak')
    @Public()
    peak(@Query('zone') zone?: string) {
        return { zoneId: zone ? Number(zone) : null, slots: [] };
    }

    @Get('public/datasets')
    @Public()
    datasets() {
        return [{ id: 'zone-kpi', title: 'Chỉ số phường', href: '/api/v1/public/zone-kpi' }];
    }
}
