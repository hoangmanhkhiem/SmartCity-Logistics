import { Module } from '@nestjs/common';
import { ZoneModule } from '../zone/zone.module';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';

@Module({
    imports: [ZoneModule],
    controllers: [OrderController],
    providers: [OrderService],
    exports: [OrderService],
})
export class OrderModule { }
