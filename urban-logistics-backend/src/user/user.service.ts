import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto';

@Injectable()
export class UserService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(page = 1, limit = 10) {
        const pageNum = Number(page) || 1; const limitNum = Number(limit) || 10; const skip = (pageNum - 1) * limitNum;
        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                skip,
                take: limitNum,
                select: {
                    id: true,
                    email: true,
                    name: true,
                    phone: true,
                    isActive: true,
                    createdAt: true,
                    updatedAt: true,
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.user.count(),
        ]);

        return {
            data: users,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limitNum),
            },
        };
    }

    async findOne(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                avatarUrl: true,
                isActive: true,
                lastLoginAt: true,
                createdAt: true,
                updatedAt: true,
                memberships: {
                    include: {
                        organization: true,
                        role: true,
                    },
                },
            },
        });

        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }

        return user;
    }

    async update(id: string, updateUserDto: UpdateUserDto) {
        await this.findOne(id);

        return this.prisma.user.update({
            where: { id },
            data: updateUserDto,
            select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                avatarUrl: true,
                isActive: true,
                updatedAt: true,
            },
        });
    }

    async remove(id: string) {
        await this.findOne(id);

        return this.prisma.user.delete({
            where: { id },
        });
    }
}
