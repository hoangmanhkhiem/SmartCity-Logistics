import { Body, Controller, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard, RolesGuard } from '../../middlewares/guards';
import { Public, Roles } from '../../middlewares/decorators';
import { PhasesService } from './phases.service';

class SimulateOrdersDto {
    @IsOptional() @IsInt() count?: number;
    @IsOptional() @IsInt() zoneId?: number;
}

class ImportCsvDto {
    @IsString() csv: string;
    @IsOptional() commit?: boolean;
}

@Controller('phases')
@ApiTags('phases')
export class PhasesController {
    constructor(private readonly phases: PhasesService) {}

    @Post('demo/ensure')
    @Public()
    @ApiOperation({ summary: 'Sinh dữ liệu mẫu GĐ1–GĐ2 nếu chưa có phiếu' })
    ensure() {
        return this.phases.ensureDemo();
    }

    @Post('surveys/import')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('researcher', 'platform_admin', 'sys_admin')
    @ApiOperation({ summary: 'FR11.1 — import CSV, báo lỗi từng dòng' })
    importSurvey(@Body() body: ImportCsvDto) {
        return body.commit ? this.phases.commitSurveyCsv(body.csv) : this.phases.importSurveyCsv(body.csv);
    }

    @Get('surveys/:code/export')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('researcher', 'platform_admin', 'sys_admin')
    @ApiOperation({ summary: 'FR11.6 — CSV + codebook' })
    exportSurvey(@Param('code') code: string) {
        return this.phases.exportSurvey(code);
    }

    @Get('surveys/progress-by-zone')
    @Public()
    @ApiOperation({ summary: 'FR11.4 — tiến độ theo phường' })
    progress() {
        return this.phases.progressByZone();
    }

    @Get('profiles/operation')
    @Public()
    operation() {
        return this.phases.operationProfile();
    }

    @Get('profiles/peak')
    @Public()
    peak() {
        return this.phases.peakProfile();
    }

    @Post('orders/simulate')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    simulate(@Body() body: SimulateOrdersDto) {
        return this.phases.simulateOrders(body.count ?? 20, body.zoneId);
    }

    @Post('orders/import')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    importOrders(@Body() body: ImportCsvDto) {
        return this.phases.importOrdersCsv(body.csv);
    }

    @Post('facilities/import')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('org_admin', 'carrier_ops', 'platform_admin', 'sys_admin')
    importFacilities(@Body() body: { organizationId?: number; features: Array<{ name?: string; kind?: string; lat: number; lon: number }> }) {
        return this.phases.importFacilities(body);
    }

    @Post('plans/solve')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'FR5/FR14 — lịch trình + cảnh báo vùng cấm' })
    solve() {
        return this.phases.solvePlan();
    }

    @Get('partner/profile')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    profile(@Req() req: { user: { memberships?: Array<{ organizationId: number }> } }) {
        const orgId = req.user.memberships?.[0]?.organizationId;
        return orgId ? this.phases.partnerProfile(orgId) : null;
    }

    @Put('partner/profile')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    updateProfile(
        @Req() req: { user: { memberships?: Array<{ organizationId: number }> } },
        @Body() body: { fleetSize?: number; anonymizePublic?: boolean; isPartner?: boolean; address?: string },
    ) {
        const orgId = req.user.memberships?.[0]?.organizationId;
        return orgId ? this.phases.updatePartner(orgId, body) : null;
    }

    @Get('partner/report')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    report(@Req() req: { user: { memberships?: Array<{ organizationId: number }> } }) {
        const orgId = req.user.memberships?.[0]?.organizationId;
        return orgId ? this.phases.partnerReport(orgId) : null;
    }
}
