import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Carrier, Facility, Order, Organization, Restriction, Zone } from '../../../db/entities';
import { IssueReport } from '../../../db/entities/platform.entity';
import { SurveyForm, SurveyResponse } from '../../../db/entities/survey.entity';
import { TrafficModule } from '../traffic/traffic.module';
import { PhasesController } from './phases.controller';
import { PhasesService } from './phases.service';

@Module({
    imports: [TrafficModule, TypeOrmModule.forFeature([SurveyForm, SurveyResponse, IssueReport, Zone, Order, Facility, Carrier, Organization, Restriction])],
    controllers: [PhasesController],
    providers: [PhasesService],
})
export class PhasesModule {}
