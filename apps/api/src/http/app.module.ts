import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { loadEnvConfig } from '../config/env';
import { PrismaModule } from '../db/prisma.module';
import { AuthModule } from './routes/auth/auth.module';
import { UserModule } from './routes/user/user.module';
import { OrganizationModule } from './routes/organization/organization.module';
import { CarrierModule } from './routes/carrier/carrier.module';
import { VehicleModule } from './routes/vehicle/vehicle.module';
import { FacilityModule } from './routes/facility/facility.module';
import { ZoneModule } from './routes/zone/zone.module';
import { OrderModule } from './routes/order/order.module';
import { RouteModule } from './routes/route/route.module';
import { TelemetryModule } from './routes/telemetry/telemetry.module';
import { PartnerModule } from './routes/partner/partner.module';
import { IntegrationsModule } from './routes/integrations/integrations.module';
import { AnalyticsModule } from './routes/analytics/analytics.module';
import { ShippersModule } from './routes/shippers/shippers.module';
import { TrackingModule } from './routes/tracking/tracking.module';
import { TrafficRestrictionModule } from './routes/traffic-restriction/traffic-restriction.module';
import { HealthController } from './routes/health.controller';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['.env', '../../.env'],
            load: [loadEnvConfig],
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
        PartnerModule,
        IntegrationsModule,
        AnalyticsModule,
        ShippersModule,
        TrackingModule,
        TrafficRestrictionModule,
    ],
    controllers: [HealthController],
})
export class AppModule {}
