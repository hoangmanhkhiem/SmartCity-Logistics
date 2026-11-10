import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../db/prisma.module';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';

@Module({
    imports: [PrismaModule],
    controllers: [IntegrationsController],
    providers: [IntegrationsService],
})
export class IntegrationsModule {}
