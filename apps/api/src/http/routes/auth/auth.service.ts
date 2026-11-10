import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { promisify } from 'node:util';
import { Repository } from 'typeorm';
import { User } from '../../../db/entities';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const hashPassword = promisify(bcrypt.hash) as (data: string, saltOrRounds: string | number) => Promise<string>;
const comparePassword = promisify(bcrypt.compare) as (data: string, encrypted: string) => Promise<boolean>;

const membershipRelations = [
    'memberships',
    'memberships.organization',
    'memberships.role',
    'memberships.role.rolePermissions',
    'memberships.role.rolePermissions.permission',
] as const;

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User) private readonly userRepo: Repository<User>,
        private readonly jwtService: JwtService,
    ) {}

    async register(registerDto: RegisterDto) {
        const { email, password, name, phone } = registerDto;

        const existingUser = await this.userRepo.findOne({ where: { email } });
        if (existingUser) {
            throw new UnauthorizedException('Email already exists');
        }

        const hashedPassword = await hashPassword(password, 10);
        const user = await this.userRepo.save(
            this.userRepo.create({
                email,
                password: hashedPassword,
                name,
                phone,
            }),
        );

        const token = this.generateToken(user.id, user.email);

        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                phone: user.phone,
                createdAt: user.createdAt,
            },
            ...token,
        };
    }

    async login(loginDto: LoginDto) {
        const { email, password } = loginDto;

        const user = await this.userRepo.findOne({
            where: { email },
            relations: [...membershipRelations],
        });

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isPasswordValid = await comparePassword(password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        await this.userRepo.update(user.id, { lastLoginAt: new Date() });

        const token = this.generateToken(user.id, user.email);
        const { password: _, ...userWithoutPassword } = user;

        return {
            user: userWithoutPassword,
            ...token,
        };
    }

    async validateUser(userId: string) {
        const user = await this.userRepo.findOne({
            where: { id: Number(userId) },
            relations: [...membershipRelations],
        });

        if (!user || !user.isActive) {
            throw new UnauthorizedException('User not found or inactive');
        }

        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    private generateToken(userId: number, email: string) {
        const payload = { sub: String(userId), email };
        const accessToken = this.jwtService.sign(payload);

        return {
            accessToken,
            tokenType: 'Bearer',
        };
    }
}
