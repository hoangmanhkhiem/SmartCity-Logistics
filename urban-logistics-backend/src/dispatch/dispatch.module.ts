import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DispatchController } from './dispatch.controller';
import { DispatchService } from './dispatch.service';

@Module({
    imports: [PrismaModule],
    controllers: [DispatchController],
    providers: [DispatchService],
})
export class DispatchModule {}
