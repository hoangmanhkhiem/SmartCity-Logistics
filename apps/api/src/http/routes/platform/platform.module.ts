import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DemandAgg, EmissionFactor, IssueReport, JobRecord, Plan, Scenario } from '../../../db/entities/platform.entity';
import { PlatformController } from './platform.controller';
import { PlatformService } from './platform.service';

@Module({
    imports: [TypeOrmModule.forFeature([EmissionFactor, IssueReport, Plan, Scenario, JobRecord, DemandAgg])],
    controllers: [PlatformController],
    providers: [PlatformService],
})
export class PlatformModule {}
