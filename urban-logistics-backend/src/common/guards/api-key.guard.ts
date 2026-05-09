import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
    constructor(private readonly prisma: PrismaService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest<{ headers: Record<string, string | string[] | undefined>; partner?: unknown }>();
        const raw = req.headers['x-api-key'] ?? req.headers['X-Api-Key'];
        const key = typeof raw === 'string' ? raw.trim() : Array.isArray(raw) ? raw[0]?.trim() : '';
        if (!key) {
            throw new UnauthorizedException('Missing X-Api-Key header');
        }
        const keyHash = createHash('sha256').update(key, 'utf8').digest('hex');
        const client = await this.prisma.platformApiClient.findFirst({
            where: { keyHash, isActive: true },
        });
        if (!client) {
            throw new UnauthorizedException('Invalid API key');
        }
        req.partner = client;
        return true;
    }
}
