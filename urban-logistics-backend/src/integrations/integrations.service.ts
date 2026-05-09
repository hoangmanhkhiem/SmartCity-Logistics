import { Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class IntegrationsService {
    constructor(private readonly prisma: PrismaService) {}

    async createClient(name: string) {
        const rawKey = `ulc_live_${randomBytes(24).toString('base64url')}`;
        const keyHash = createHash('sha256').update(rawKey, 'utf8').digest('hex');
        const keyPrefix = rawKey.slice(0, 22);
        const client = await this.prisma.platformApiClient.create({
            data: {
                name,
                keyPrefix,
                keyHash,
                scopes: ['orders:create'],
            },
        });
        return {
            id: client.id,
            name: client.name,
            keyPrefix: client.keyPrefix,
            apiKey: rawKey,
            message: 'Lưu apiKey ngay — chỉ hiển thị một lần.',
        };
    }

    listClients() {
        return this.prisma.platformApiClient.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                keyPrefix: true,
                scopes: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
                _count: { select: { orders: true } },
            },
        });
    }
}
