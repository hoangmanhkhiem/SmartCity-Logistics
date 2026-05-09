import { Module } from '@nestjs/common';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { PartnerController } from './partner.controller';
import { PartnerService } from './partner.service';

@Module({
    imports: [PrismaModule],
    controllers: [PartnerController],
    providers: [PartnerService, ApiKeyGuard],
})
export class PartnerModule {}
