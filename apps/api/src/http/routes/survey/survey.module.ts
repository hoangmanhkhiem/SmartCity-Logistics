import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SurveyAssignment, SurveyForm, SurveyResponse } from '../../../db/entities/survey.entity';
import { SurveyController } from './survey.controller';
import { SurveyService } from './survey.service';

@Module({
    imports: [TypeOrmModule.forFeature([SurveyForm, SurveyAssignment, SurveyResponse])],
    controllers: [SurveyController],
    providers: [SurveyService],
})
export class SurveyModule {}
