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
exports.VehicleService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let VehicleService = class VehicleService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        return this.prisma.vehicle.create({ data: dto, include: { carrier: true } });
    }
    async findAll(page = 1, limit = 10, carrierId, type) {
        const pageNum = Number(page) || 1;
        const limitNum = Number(limit) || 10;
        const skip = (pageNum - 1) * limitNum;
        const where = { ...(carrierId && { carrierId }), ...(type && { type }) };
        const [data, total] = await Promise.all([
            this.prisma.vehicle.findMany({ where, skip, take: limitNum, include: { carrier: { include: { organization: true } } }, orderBy: { createdAt: 'desc' } }),
            this.prisma.vehicle.count({ where }),
        ]);
        return { data, meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) } };
    }
    async findOne(id) {
        const v = await this.prisma.vehicle.findUnique({ where: { id }, include: { carrier: { include: { organization: true } } } });
        if (!v)
            throw new common_1.NotFoundException(`Vehicle ${id} not found`);
        return v;
    }
    async update(id, dto) {
        await this.findOne(id);
        return this.prisma.vehicle.update({ where: { id }, data: dto, include: { carrier: true } });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.vehicle.delete({ where: { id } });
    }
};
exports.VehicleService = VehicleService;
exports.VehicleService = VehicleService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], VehicleService);
//# sourceMappingURL=vehicle.service.js.map