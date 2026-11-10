import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../db/prisma.module';
import { TrackingController } from './tracking.controller';
import { TrackingService } from './tracking.service';

@Module({
    imports: [PrismaModule],
    controllers: [TrackingController],
    providers: [TrackingService],
})
export class TrackingModule {}
