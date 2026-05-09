import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { OrganizationModule } from './organization/organization.module';
import { CarrierModule } from './carrier/carrier.module';
import { VehicleModule } from './vehicle/vehicle.module';
import { FacilityModule } from './facility/facility.module';
import { ZoneModule } from './zone/zone.module';
import { OrderModule } from './order/order.module';
import { RouteModule } from './route/route.module';
import { TelemetryModule } from './telemetry/telemetry.module';
import { ResearchModule } from './research/research.module';
import { PartnerModule } from './partner/partner.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { DispatchModule } from './dispatch/dispatch.module';
import { QuotesModule } from './quotes/quotes.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { DriversModule } from './drivers/drivers.module';
import { TrackingModule } from './tracking/tracking.module';
import { HealthController } from './health.controller';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),
        PrismaModule,
        AuthModule,
        UserModule,
        OrganizationModule,
        CarrierModule,
        VehicleModule,
        FacilityModule,
        ZoneModule,
        OrderModule,
        RouteModule,
        TelemetryModule,
        ResearchModule,
        PartnerModule,
        IntegrationsModule,
        DispatchModule,
        QuotesModule,
        AnalyticsModule,
        DriversModule,
        TrackingModule,
    ],
    controllers: [HealthController],
})
export class AppModule { }
