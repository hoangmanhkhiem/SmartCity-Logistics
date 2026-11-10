import { Module } from '@nestjs/common';
import { ApiKeyGuard } from '../../middlewares/guards/api-key.guard';
import { ZoneModule } from '../zone/zone.module';
import { PartnerController } from './partner.controller';
import { PartnerService } from './partner.service';

@Module({
    imports: [ZoneModule],
    controllers: [PartnerController],
    providers: [PartnerService, ApiKeyGuard],
})
export class PartnerModule {}
