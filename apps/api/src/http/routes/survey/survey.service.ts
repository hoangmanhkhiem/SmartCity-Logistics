import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SurveyAssignment, SurveyForm, SurveyResponse } from '../../../db/entities/survey.entity';

const FORM_CODES = ['shipper', 'last_mile_company', 'platform', 'logistics_company', 'regulator'] as const;

@Injectable()
export class SurveyService {
    constructor(
        @InjectRepository(SurveyForm) private readonly forms: Repository<SurveyForm>,
        @InjectRepository(SurveyAssignment) private readonly assignments: Repository<SurveyAssignment>,
        @InjectRepository(SurveyResponse) private readonly responses: Repository<SurveyResponse>,
    ) {}

    async ensureForms() {
        for (const code of FORM_CODES) {
            const existing = await this.forms.findOne({ where: { code } });
            if (!existing) {
                await this.forms.save(this.forms.create({ code, version: 1, questionMap: null }));
            }
        }
        return this.forms.find();
    }

    listForms() {
        return this.ensureForms();
    }

    assign(input: {
        userId: number;
        zoneId?: number;
        formCode?: string;
        quota?: number;
        dueDate?: string;
        assignedBy?: number;
    }) {
        return this.forms.findOne({ where: { code: input.formCode ?? 'shipper' } }).then(async (form) => {
            if (input.formCode && !form) {
                throw new NotFoundException(`Unknown form ${input.formCode}`);
            }
            return this.assignments.save(
                this.assignments.create({
                    userId: input.userId,
                    zoneId: input.zoneId ?? null,
                    formId: form?.id ?? null,
                    quota: input.quota ?? 0,
                    dueDate: input.dueDate ? new Date(input.dueDate) : null,
                    status: 'open',
                    assignedBy: input.assignedBy ?? null,
                }),
            );
        });
    }

    listAssignments(userId?: number) {
        return this.assignments.find({
            where: userId ? { userId } : {},
            relations: { form: true, zone: true, user: true },
            order: { id: 'DESC' },
        });
    }

    async submit(formCode: string, body: {
        answers: Record<string, unknown>;
        siteCode?: string;
        zoneId?: number;
        latitude?: number;
        longitude?: number;
        organizationId?: number;
        submittedBy?: number;
    }) {
        const form = await this.forms.findOne({ where: { code: formCode } });
        if (!form) throw new NotFoundException(`Unknown form ${formCode}`);
        if (!body.answers || typeof body.answers !== 'object') {
            throw new BadRequestException('answers object is required');
        }
        return this.responses.save(
            this.responses.create({
                formId: form.id,
                siteCode: body.siteCode ?? null,
                zoneId: body.zoneId ?? null,
                latitude: body.latitude ?? null,
                longitude: body.longitude ?? null,
                organizationId: body.organizationId ?? null,
                answersRaw: body.answers,
                status: 'submitted',
                source: 'survey',
                verified: false,
                submittedBy: body.submittedBy ?? null,
            }),
        );
    }

    async review(id: number, status: 'approved' | 'rejected', reviewerId: number, rejectReason?: string) {
        const row = await this.responses.findOne({ where: { id } });
        if (!row) throw new NotFoundException('Response not found');
        row.status = status;
        row.verified = status === 'approved';
        row.approvedBy = reviewerId;
        row.rejectReason = status === 'rejected' ? rejectReason ?? 'rejected' : null;
        return this.responses.save(row);
    }

    async progress() {
        const forms = await this.ensureForms();
        const rows = await this.responses
            .createQueryBuilder('r')
            .select('r.form_id', 'formId')
            .addSelect('r.status', 'status')
            .addSelect('COUNT(*)', 'n')
            .groupBy('r.form_id')
            .addGroupBy('r.status')
            .getRawMany<{ formId: number; status: string; n: string }>();
        return forms.map((form) => ({
            form: form.code,
            counts: rows
                .filter((r) => Number(r.formId) === form.id)
                .map((r) => ({ status: r.status, n: Number(r.n) })),
        }));
    }

    assertCanReview(roleNames: string[]) {
        const ok = roleNames.some((n) =>
            ['researcher', 'sys_admin', 'platform_admin', 'regulator'].includes(n),
        );
        if (!ok) throw new ForbiddenException('Researcher or admin required');
    }

    listResponses() {
        return this.responses.find({ order: { id: 'DESC' }, take: 200, relations: { form: true } });
    }

    async updateResponse(id: number, patch: { siteCode?: string; status?: string; note?: string }) {
        const row = await this.responses.findOne({ where: { id } });
        if (!row) throw new NotFoundException('Response not found');
        if (patch.siteCode != null) row.siteCode = patch.siteCode;
        if (patch.status != null) {
            row.status = patch.status;
            row.verified = patch.status === 'approved';
        }
        if (patch.note != null) {
            row.answersRaw = { ...row.answersRaw, note: patch.note };
        }
        return this.responses.save(row);
    }

    async deleteResponse(id: number) {
        const row = await this.responses.findOne({ where: { id } });
        if (!row) throw new NotFoundException('Response not found');
        await this.responses.remove(row);
        return { deleted: true };
    }

    async updateAssignment(id: number, patch: { quota?: number; status?: string; zoneId?: number }) {
        const row = await this.assignments.findOne({ where: { id } });
        if (!row) throw new NotFoundException('Assignment not found');
        if (patch.quota != null) row.quota = patch.quota;
        if (patch.status != null) row.status = patch.status;
        if (patch.zoneId != null) row.zoneId = patch.zoneId;
        return this.assignments.save(row);
    }

    async deleteAssignment(id: number) {
        const row = await this.assignments.findOne({ where: { id } });
        if (!row) throw new NotFoundException('Assignment not found');
        await this.assignments.remove(row);
        return { deleted: true };
    }
}
