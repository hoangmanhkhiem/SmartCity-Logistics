import { Module } from '@nestjs/common';
import { RouteService } from './route.service';
import { RouteController } from './route.controller';
import { TrafficRestrictionModule } from '../traffic-restriction/traffic-restriction.module';
import { TrafficModule } from '../traffic/traffic.module';
import { PlatformModule } from '../platform/platform.module';

@Module({
    imports: [TrafficRestrictionModule, TrafficModule, PlatformModule],
    controllers: [RouteController],
    providers: [RouteService],
    exports: [RouteService],
})
export class RouteModule { }
