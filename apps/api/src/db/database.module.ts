import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ENTITIES } from './entities';

@Global()
@Module({
    imports: [
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                const databaseUrl = config.get<string>('databaseUrl') ?? process.env.DATABASE_URL;
                if (!databaseUrl) {
                    throw new Error('DATABASE_URL is required');
                }
                const url = new URL(databaseUrl);
                return {
                    type: 'mysql' as const,
                    host: url.hostname,
                    port: url.port ? Number(url.port) : 3306,
                    username: decodeURIComponent(url.username),
                    password: decodeURIComponent(url.password),
                    database: url.pathname.replace(/^\//, ''),
                    entities: ENTITIES,
                    migrations: [__dirname + '/migrations-typeorm/*.{ts,js}'],
                    migrationsTableName: 'typeorm_migrations',
                    migrationsRun: true,
                    synchronize: false,
                    charset: 'utf8mb4',
                };
            },
        }),
        TypeOrmModule.forFeature(ENTITIES),
    ],
    exports: [TypeOrmModule],
})
export class DatabaseModule {}
