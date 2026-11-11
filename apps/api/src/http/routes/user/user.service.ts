import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../db/entities';
import { UpdateUserDto } from './dto';

@Injectable()
export class UserService {
    constructor(@InjectRepository(User) private readonly userRepo: Repository<User>) {}

    async findAll(page = 1, limit = 10) {
        const pageNum = Number(page) || 1;
        const limitNum = Number(limit) || 10;
        const skip = (pageNum - 1) * limitNum;
        const [users, total] = await Promise.all([
            this.userRepo.find({
                skip,
                take: limitNum,
                relations: ['memberships', 'memberships.organization', 'memberships.role'],
                order: { createdAt: 'DESC' },
            }),
            this.userRepo.count(),
        ]);

        return {
            data: users.map(({ password: _pw, ...rest }) => rest),
            meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
        };
    }

    async findOne(id: number) {
        const user = await this.userRepo.findOne({
            where: { id },
            relations: ['memberships', 'memberships.organization', 'memberships.role'],
        });

        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }

        const { password: _pw, ...rest } = user;
        return rest;
    }

    async update(id: number, updateUserDto: UpdateUserDto) {
        await this.findOne(id);
        await this.userRepo.update(id, updateUserDto);
        return this.userRepo.findOne({
            where: { id },
            select: ['id', 'email', 'name', 'phone', 'avatarUrl', 'isActive', 'updatedAt'],
        });
    }

    async remove(id: number) {
        await this.findOne(id);
        return this.userRepo.remove(await this.userRepo.findOneByOrFail({ id }));
    }
}
