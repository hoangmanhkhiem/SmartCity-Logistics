import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SpeedProfile, TrafficProbe, TrafficQuota, TrafficSample } from '../../../db/entities/traffic.entity';
import { TrafficController } from './traffic.controller';
import { TrafficService } from './traffic.service';

@Module({
    imports: [TypeOrmModule.forFeature([TrafficProbe, TrafficSample, SpeedProfile, TrafficQuota])],
    controllers: [TrafficController],
    providers: [TrafficService],
    exports: [TrafficService],
})
export class TrafficModule {}
