import { Module } from '@nestjs/common';
import { ZoneModule } from '../zone/zone.module';
import { CarrierService } from './carrier.service';
import { CarrierController } from './carrier.controller';

@Module({
    imports: [ZoneModule],
    controllers: [CarrierController],
    providers: [CarrierService],
    exports: [CarrierService],
})
export class CarrierModule { }
