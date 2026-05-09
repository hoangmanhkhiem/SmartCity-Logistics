import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RoadSegmentService } from './road-segment.service';
import { RestrictionService } from './restriction.service';
import { RoadSegmentController } from './road-segment.controller';
import { RestrictionController } from './restriction.controller';

@Module({
    imports: [PrismaModule],
    controllers: [RoadSegmentController, RestrictionController],
    providers: [RoadSegmentService, RestrictionService],
    exports: [RoadSegmentService, RestrictionService],
})
export class TrafficRestrictionModule { }
