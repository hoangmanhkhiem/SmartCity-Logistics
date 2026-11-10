import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsInt, IsObject, IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard, RolesGuard } from '../../middlewares/guards';
import { Roles } from '../../middlewares/decorators';
import { SurveyService } from './survey.service';

class AssignDto {
    @IsInt() userId: number;
    @IsOptional() @IsInt() zoneId?: number;
    @IsOptional() @IsString() formCode?: string;
    @IsOptional() @IsInt() quota?: number;
    @IsOptional() @IsString() dueDate?: string;
}

class SubmitDto {
    @IsObject() answers: Record<string, unknown>;
    @IsOptional() @IsString() siteCode?: string;
    @IsOptional() @IsInt() zoneId?: number;
    @IsOptional() latitude?: number;
    @IsOptional() longitude?: number;
    @IsOptional() @IsInt() organizationId?: number;
}

class ReviewDto {
    @IsString() status: 'approved' | 'rejected';
    @IsOptional() @IsString() rejectReason?: string;
}

@Controller('surveys')
@ApiTags('surveys')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class SurveyController {
    constructor(private readonly survey: SurveyService) {}

    @Get('forms')
    @ApiOperation({ summary: 'FR11 — 5 bộ phiếu khảo sát' })
    forms() {
        return this.survey.listForms();
    }

    @Get('progress')
    @Roles('researcher', 'sys_admin', 'platform_admin', 'regulator')
    @ApiOperation({ summary: 'FR11.4 — tiến độ theo bộ phiếu' })
    progress() {
        return this.survey.progress();
    }

    @Post('assignments')
    @Roles('researcher', 'sys_admin', 'platform_admin')
    @ApiOperation({ summary: 'Giao nhiệm vụ khảo sát (SURVEY_ASSIGNMENT)' })
    assign(@Body() dto: AssignDto, @Req() req: { user: { id: number } }) {
        return this.survey.assign({ ...dto, assignedBy: req.user.id });
    }

    @Get('assignments')
    @ApiOperation({ summary: 'Nhiệm vụ của tôi, hoặc toàn bộ nếu researcher/admin' })
    assignments(@Query('mine') mine: string | undefined, @Req() req: { user: { id: number; memberships?: { role: { name: string } }[] } }) {
        const names = (req.user.memberships ?? []).map((m) => m.role.name);
        const elevated = names.some((n) => ['researcher', 'sys_admin', 'platform_admin'].includes(n));
        return this.survey.listAssignments(elevated && mine !== '1' ? undefined : req.user.id);
    }

    @Post('forms/:code/responses')
    @ApiOperation({ summary: 'FR11.3 — nộp phiếu (thành viên được giao hoặc researcher)' })
    submit(
        @Param('code') code: string,
        @Body() dto: SubmitDto,
        @Req() req: { user: { id: number } },
    ) {
        return this.survey.submit(code, { ...dto, submittedBy: req.user.id });
    }

    @Patch('responses/:id/review')
    @Roles('researcher', 'sys_admin', 'platform_admin')
    @ApiOperation({ summary: 'FR11.5 — duyệt / từ chối phiếu' })
    review(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: ReviewDto,
        @Req() req: { user: { id: number } },
    ) {
        return this.survey.review(id, dto.status, req.user.id, dto.rejectReason);
    }

    @Get('responses')
    @Roles('researcher', 'sys_admin', 'platform_admin', 'regulator')
    @ApiOperation({ summary: 'Danh sách phiếu khảo sát' })
    listResponses() {
        return this.survey.listResponses();
    }

    @Patch('responses/:id')
    @Roles('researcher', 'sys_admin', 'platform_admin')
    @ApiOperation({ summary: 'Sửa phiếu khảo sát' })
    updateResponse(@Param('id', ParseIntPipe) id: number, @Body() body: { siteCode?: string; status?: string; note?: string }) {
        return this.survey.updateResponse(id, body);
    }

    @Delete('responses/:id')
    @Roles('researcher', 'sys_admin', 'platform_admin')
    @ApiOperation({ summary: 'Xóa phiếu khảo sát' })
    deleteResponse(@Param('id', ParseIntPipe) id: number) {
        return this.survey.deleteResponse(id);
    }

    @Patch('assignments/:id')
    @Roles('researcher', 'sys_admin', 'platform_admin')
    updateAssignment(@Param('id', ParseIntPipe) id: number, @Body() body: { quota?: number; status?: string; zoneId?: number }) {
        return this.survey.updateAssignment(id, body);
    }

    @Delete('assignments/:id')
    @Roles('researcher', 'sys_admin', 'platform_admin')
    deleteAssignment(@Param('id', ParseIntPipe) id: number) {
        return this.survey.deleteAssignment(id);
    }
}
