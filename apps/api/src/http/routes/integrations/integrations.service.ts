import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomBytes } from 'crypto';
import { Repository } from 'typeorm';
import { Order, PlatformApiClient } from '../../../db/entities';

@Injectable()
export class IntegrationsService {
    constructor(
        @InjectRepository(PlatformApiClient) private readonly clientRepo: Repository<PlatformApiClient>,
        @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    ) {}

    async createClient(name: string) {
        const rawKey = `ulc_live_${randomBytes(24).toString('base64url')}`;
        const keyHash = createHash('sha256').update(rawKey, 'utf8').digest('hex');
        const keyPrefix = rawKey.slice(0, 22);
        const client = await this.clientRepo.save(
            this.clientRepo.create({
                name,
                keyPrefix,
                keyHash,
                scopes: ['orders:create'],
            }),
        );
        return {
            id: client.id,
            name: client.name,
            keyPrefix: client.keyPrefix,
            apiKey: rawKey,
            message: 'Lưu apiKey ngay — chỉ hiển thị một lần.',
        };
    }

    async listClients() {
        const clients = await this.clientRepo.find({
            order: { createdAt: 'DESC' },
            select: ['id', 'name', 'keyPrefix', 'scopes', 'isActive', 'createdAt', 'updatedAt'],
        });
        return Promise.all(
            clients.map(async (c) => ({
                ...c,
                _count: { orders: await this.orderRepo.count({ where: { platformApiClientId: c.id } }) },
            })),
        );
    }

    async updateClient(id: number, patch: { name?: string; isActive?: boolean }) {
        const row = await this.clientRepo.findOne({ where: { id } });
        if (!row) return null;
        if (patch.name != null) row.name = patch.name;
        if (patch.isActive != null) row.isActive = patch.isActive;
        return this.clientRepo.save(row);
    }

    async deleteClient(id: number) {
        const row = await this.clientRepo.findOne({ where: { id } });
        if (!row) return { deleted: false };
        await this.clientRepo.remove(row);
        return { deleted: true };
    }
}
