import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { promisify } from 'node:util';
import { PrismaService } from '../prisma/prisma.service';

const hashPassword = promisify(bcrypt.hash) as (
    data: string,
    saltOrRounds: string | number,
) => Promise<string>;
const comparePassword = promisify(bcrypt.compare) as (
    data: string,
    encrypted: string,
) => Promise<boolean>;
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
    ) { }

    async register(registerDto: RegisterDto) {
        const { email, password, name, phone } = registerDto;

        // Check if user exists
        const existingUser = await this.prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            throw new UnauthorizedException('Email already exists');
        }

        // Hash password
        const hashedPassword = await hashPassword(password, 10);

        // Create user
        const user = await this.prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                phone,
            },
            select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                createdAt: true,
            },
        });

        // Generate token
        const token = this.generateToken(user.id, user.email);

        return {
            user,
            ...token,
        };
    }

    async login(loginDto: LoginDto) {
        const { email, password } = loginDto;

        // Find user
        const user = await this.prisma.user.findUnique({
            where: { email },
            include: {
                memberships: {
                    include: {
                        organization: true,
                        role: {
                            include: {
                                rolePermissions: {
                                    include: {
                                        permission: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Check password
        const isPasswordValid = await comparePassword(password, user.password);

        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Update last login
        await this.prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });

        // Generate token
        const token = this.generateToken(user.id, user.email);

        // Prepare response
        const { password: _, ...userWithoutPassword } = user;

        return {
            user: userWithoutPassword,
            ...token,
        };
    }

    async validateUser(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                memberships: {
                    include: {
                        organization: true,
                        role: {
                            include: {
                                rolePermissions: {
                                    include: {
                                        permission: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!user || !user.isActive) {
            throw new UnauthorizedException('User not found or inactive');
        }

        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    private generateToken(userId: string, email: string) {
        const payload = { sub: userId, email };
        const accessToken = this.jwtService.sign(payload);

        return {
            accessToken,
            tokenType: 'Bearer',
        };
    }
}
