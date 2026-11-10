import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Zone } from './zone.entity';
import { Organization } from './organization.entity';

@Entity('survey_forms')
export class SurveyForm {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 64, unique: true })
    code: string;

    @Column({ default: 1 })
    version: number;

    @Column({ name: 'question_map', type: 'json', nullable: true })
    questionMap: Record<string, string> | null;

    @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 3 })
    updatedAt: Date;
}

/** Nhiệm vụ khảo sát — thay role surveyor (thiết kế v2.0 mục 2). */
@Entity('survey_assignments')
export class SurveyAssignment {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'user_id' })
    userId: number;

    @Column({ name: 'zone_id', nullable: true })
    zoneId: number | null;

    @Column({ name: 'form_id', nullable: true })
    formId: number | null;

    @Column({ default: 0 })
    quota: number;

    @Column({ name: 'due_date', type: 'datetime', precision: 3, nullable: true })
    dueDate: Date | null;

    @Column({ length: 16, default: 'open' })
    status: string;

    @Column({ name: 'assigned_by', nullable: true })
    assignedBy: number | null;

    @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 3 })
    updatedAt: Date;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => Zone, { nullable: true })
    @JoinColumn({ name: 'zone_id' })
    zone: Zone | null;

    @ManyToOne(() => SurveyForm, { nullable: true })
    @JoinColumn({ name: 'form_id' })
    form: SurveyForm | null;
}

@Entity('survey_responses')
export class SurveyResponse {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'form_id' })
    formId: number;

    @Column({ name: 'site_code', length: 32, nullable: true })
    siteCode: string | null;

    @Column({ name: 'organization_id', nullable: true })
    organizationId: number | null;

    @Column({ name: 'zone_id', nullable: true })
    zoneId: number | null;

    @Column({ type: 'double', nullable: true })
    latitude: number | null;

    @Column({ type: 'double', nullable: true })
    longitude: number | null;

    @Column({ name: 'answers_raw', type: 'json' })
    answersRaw: Record<string, unknown>;

    @Column({ length: 16, default: 'submitted' })
    status: string;

    @Column({ name: 'reject_reason', type: 'text', nullable: true })
    rejectReason: string | null;

    @Column({ default: 'survey' })
    source: string;

    @Column({ default: false })
    verified: boolean;

    @Column({ name: 'submitted_by', nullable: true })
    submittedBy: number | null;

    @Column({ name: 'approved_by', nullable: true })
    approvedBy: number | null;

    @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 3 })
    updatedAt: Date;

    @ManyToOne(() => SurveyForm)
    @JoinColumn({ name: 'form_id' })
    form: SurveyForm;

    @ManyToOne(() => Organization, { nullable: true })
    @JoinColumn({ name: 'organization_id' })
    organization: Organization | null;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'submitted_by' })
    submitter: User | null;
}
