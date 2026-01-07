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
exports.ZoneService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ZoneService = class ZoneService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) { return this.prisma.zone.create({ data: dto }); }
    async findAll(page = 1, limit = 10, type) {
        const pageNum = Number(page) || 1;
        const limitNum = Number(limit) || 10;
        const skip = (pageNum - 1) * limitNum;
        const where = type ? { type } : {};
        const [data, total] = await Promise.all([
            this.prisma.zone.findMany({ where, skip, take: limitNum, include: { _count: { select: { facilities: true, roadSegments: true, restrictions: true } } }, orderBy: { name: 'asc' } }),
            this.prisma.zone.count({ where }),
        ]);
        return { data, meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) } };
    }
    async findOne(id) {
        const z = await this.prisma.zone.findUnique({ where: { id }, include: { facilities: true, roadSegments: true, restrictions: true } });
        if (!z)
            throw new common_1.NotFoundException(`Zone ${id} not found`);
        return z;
    }
    async update(id, dto) { await this.findOne(id); return this.prisma.zone.update({ where: { id }, data: dto }); }
    async remove(id) { await this.findOne(id); return this.prisma.zone.delete({ where: { id } }); }
};
exports.ZoneService = ZoneService;
exports.ZoneService = ZoneService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ZoneService);
//# sourceMappingURL=zone.service.js.map