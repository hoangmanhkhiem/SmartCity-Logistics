import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RouteModule } from '../route/route.module';
import { ShippersController } from './shippers.controller';
import { ShippersService } from './shippers.service';

@Module({
    imports: [PrismaModule, RouteModule],
    controllers: [ShippersController],
    providers: [ShippersService],
    exports: [ShippersService],
})
export class ShippersModule { }
