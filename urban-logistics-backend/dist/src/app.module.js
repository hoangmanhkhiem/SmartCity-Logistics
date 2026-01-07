"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./auth/auth.module");
const user_module_1 = require("./user/user.module");
const organization_module_1 = require("./organization/organization.module");
const carrier_module_1 = require("./carrier/carrier.module");
const vehicle_module_1 = require("./vehicle/vehicle.module");
const facility_module_1 = require("./facility/facility.module");
const zone_module_1 = require("./zone/zone.module");
const order_module_1 = require("./order/order.module");
const route_module_1 = require("./route/route.module");
const telemetry_module_1 = require("./telemetry/telemetry.module");
const health_controller_1 = require("./health.controller");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            user_module_1.UserModule,
            organization_module_1.OrganizationModule,
            carrier_module_1.CarrierModule,
            vehicle_module_1.VehicleModule,
            facility_module_1.FacilityModule,
            zone_module_1.ZoneModule,
            order_module_1.OrderModule,
            route_module_1.RouteModule,
            telemetry_module_1.TelemetryModule,
        ],
        controllers: [health_controller_1.HealthController],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map