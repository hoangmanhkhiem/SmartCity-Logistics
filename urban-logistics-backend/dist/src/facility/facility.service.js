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
exports.FacilityService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let FacilityService = class FacilityService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        return this.prisma.facility.create({ data: dto, include: { organization: true, zone: true } });
    }
    async findAll(page = 1, limit = 10, organizationId, kind, zoneId) {
        const pageNum = Number(page) || 1;
        const limitNum = Number(limit) || 10;
        const skip = (pageNum - 1) * limitNum;
        const where = { ...(organizationId && { organizationId }), ...(kind && { kind }), ...(zoneId && { zoneId }) };
        const [data, total] = await Promise.all([
            this.prisma.facility.findMany({ where, skip, take: limitNum, include: { organization: true, zone: true, _count: { select: { chargers: true, fuelPumps: true, docks: true } } }, orderBy: { createdAt: 'desc' } }),
            this.prisma.facility.count({ where }),
        ]);
        return { data, meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) } };
    }
    async findOne(id) {
        const f = await this.prisma.facility.findUnique({ where: { id }, include: { organization: true, zone: true, chargers: true, fuelPumps: true, docks: true } });
        if (!f)
            throw new common_1.NotFoundException(`Facility ${id} not found`);
        return f;
    }
    async update(id, dto) {
        await this.findOne(id);
        return this.prisma.facility.update({ where: { id }, data: dto, include: { organization: true, zone: true } });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.facility.delete({ where: { id } });
    }
};
exports.FacilityService = FacilityService;
exports.FacilityService = FacilityService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FacilityService);
//# sourceMappingURL=facility.service.js.map