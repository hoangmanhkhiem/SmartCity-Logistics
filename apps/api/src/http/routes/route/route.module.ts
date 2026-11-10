import { Module } from '@nestjs/common';
import { RouteService } from './route.service';
import { RouteController } from './route.controller';
import { TrafficRestrictionModule } from '../traffic-restriction/traffic-restriction.module';
import { TrafficModule } from '../traffic/traffic.module';

@Module({
    imports: [TrafficRestrictionModule, TrafficModule],
    controllers: [RouteController],
    providers: [RouteService],
    exports: [RouteService],
})
export class RouteModule { }
