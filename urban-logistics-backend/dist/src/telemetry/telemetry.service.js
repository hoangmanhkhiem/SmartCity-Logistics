"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelemetryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let TelemetryService = class TelemetryService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        return this.prisma.telemetry.create({ data: dto, include: { vehicle: true } });
    }
    async findByVehicle(vehicleId, page = 1, limit = 100, from, to) {
        const pageNum = Number(page) || 1;
        const limitNum = Number(limit) || 10;
        const skip = (pageNum - 1) * limitNum;
        const where = {
            vehicleId,
            ...(from || to ? { timestamp: { ...(from && { gte: from }), ...(to && { lte: to }) } } : {}),
        };
        const [data, total] = await Promise.all([
            this.prisma.telemetry.findMany({ where, skip, take: limitNum, orderBy: { timestamp: 'desc' } }),
            this.prisma.telemetry.count({ where }),
        ]);
        return { data, meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) } };
    }
    async getLatest(vehicleId) {
        const t = await this.prisma.telemetry.findFirst({ where: { vehicleId }, orderBy: { timestamp: 'desc' }, include: { vehicle: true } });
        if (!t)
            throw new common_1.NotFoundException(`No telemetry for vehicle ${vehicleId}`);
        return t;
    }
    async findAll(page = 1, limit = 100) {
        const pageNum = Number(page) || 1;
        const limitNum = Number(limit) || 10;
        const skip = (pageNum - 1) * limitNum;
        const [data, total] = await Promise.all([
            this.prisma.telemetry.findMany({ skip, take: limitNum, orderBy: { timestamp: 'desc' }, include: { vehicle: true } }),
            this.prisma.telemetry.count(),
        ]);
        return { data, meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) } };
    }
};
exports.TelemetryService = TelemetryService;
exports.TelemetryService = TelemetryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TelemetryService);
//# sourceMappingURL=telemetry.service.js.map