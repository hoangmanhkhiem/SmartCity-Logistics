import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';
import { TrafficRestrictionModule } from '../traffic-restriction/traffic-restriction.module';

@Module({
    imports: [TrafficRestrictionModule],
    controllers: [PublicController],
    providers: [PublicService],
})
export class PublicModule {}
