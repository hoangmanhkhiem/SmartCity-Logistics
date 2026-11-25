import { Module } from '@nestjs/common';
import { SimulationController } from './simulation.controller';
import { SimulationService } from './simulation.service';
import { OsrmClient } from './osrm.client';

@Module({
    controllers: [SimulationController],
    providers: [SimulationService, OsrmClient],
    exports: [SimulationService],
})
export class SimulationModule {}
