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
exports.RouteService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let RouteService = class RouteService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) { return this.prisma.route.create({ data: dto, include: { legs: true } }); }
    async findAll(page = 1, limit = 10, mode, status) {
        const pageNum = Number(page) || 1;
        const limitNum = Number(limit) || 10;
        const skip = (pageNum - 1) * limitNum;
        const where = { ...(mode && { mode }), ...(status && { status }) };
        const [data, total] = await Promise.all([
            this.prisma.route.findMany({ where, skip, take: limitNum, include: { _count: { select: { legs: true } } }, orderBy: { createdAt: 'desc' } }),
            this.prisma.route.count({ where }),
        ]);
        return { data, meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) } };
    }
    async findOne(id) {
        const r = await this.prisma.route.findUnique({ where: { id }, include: { legs: { include: { stops: true, assignments: { include: { vehicle: true } } } } } });
        if (!r)
            throw new common_1.NotFoundException(`Route ${id} not found`);
        return r;
    }
    async update(id, dto) { await this.findOne(id); return this.prisma.route.update({ where: { id }, data: dto }); }
    async remove(id) { await this.findOne(id); return this.prisma.route.delete({ where: { id } }); }
};
exports.RouteService = RouteService;
exports.RouteService = RouteService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RouteService);
//# sourceMappingURL=route.service.js.map