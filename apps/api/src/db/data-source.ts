import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { resolveDatabaseUrl } from '../config/env';
import { ENTITIES } from './entities';

const databaseUrl = resolveDatabaseUrl();
const url = new URL(databaseUrl);

export const AppDataSource = new DataSource({
    type: 'mysql',
    host: url.hostname,
    port: url.port ? Number(url.port) : 3306,
    username: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ''),
    entities: ENTITIES,
    migrations: [__dirname + '/migrations-typeorm/*.{ts,js}'],
    migrationsTableName: 'typeorm_migrations',
    synchronize: false,
    logging: process.env.TYPEORM_LOGGING === 'true',
    charset: 'utf8mb4',
});
