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
exports.OrderService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const uuid_1 = require("uuid");
let OrderService = class OrderService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        const orderNumber = `ORD-${Date.now()}-${(0, uuid_1.v4)().slice(0, 4).toUpperCase()}`;
        return this.prisma.order.create({ data: { ...dto, orderNumber }, include: { customer: true, shipments: true } });
    }
    async findAll(page = 1, limit = 10, status, customerId) {
        const pageNum = Number(page) || 1;
        const limitNum = Number(limit) || 10;
        const skip = (pageNum - 1) * limitNum;
        const where = { ...(status && { status }), ...(customerId && { customerId }) };
        const [data, total] = await Promise.all([
            this.prisma.order.findMany({ where, skip, take: limitNum, include: { customer: true, _count: { select: { shipments: true } } }, orderBy: { createdAt: 'desc' } }),
            this.prisma.order.count({ where }),
        ]);
        return { data, meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) } };
    }
    async findOne(id) {
        const o = await this.prisma.order.findUnique({ where: { id }, include: { customer: true, shipments: { include: { legs: true } } } });
        if (!o)
            throw new common_1.NotFoundException(`Order ${id} not found`);
        return o;
    }
    async update(id, dto) { await this.findOne(id); return this.prisma.order.update({ where: { id }, data: dto, include: { customer: true } }); }
    async remove(id) { await this.findOne(id); return this.prisma.order.delete({ where: { id } }); }
};
exports.OrderService = OrderService;
exports.OrderService = OrderService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OrderService);
//# sourceMappingURL=order.service.js.map