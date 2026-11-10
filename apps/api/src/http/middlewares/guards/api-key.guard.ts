import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'crypto';
import { Repository } from 'typeorm';
import { PlatformApiClient } from '../../../db/entities';

@Injectable()
export class ApiKeyGuard implements CanActivate {
    constructor(
        @InjectRepository(PlatformApiClient) private readonly clientRepo: Repository<PlatformApiClient>,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest<{
            headers: Record<string, string | string[] | undefined>;
            partner?: unknown;
        }>();
        const raw = req.headers['x-api-key'] ?? req.headers['X-Api-Key'];
        const key = typeof raw === 'string' ? raw.trim() : Array.isArray(raw) ? raw[0]?.trim() : '';
        if (!key) {
            throw new UnauthorizedException('Missing X-Api-Key header');
        }
        const keyHash = createHash('sha256').update(key, 'utf8').digest('hex');
        const client = await this.clientRepo.findOne({ where: { keyHash, isActive: true } });
        if (!client) {
            throw new UnauthorizedException('Invalid API key');
        }
        req.partner = client;
        return true;
    }
}
