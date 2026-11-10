export interface AppEnv {
    nodeEnv: string;
    port: number;
    databaseUrl: string;
    jwtSecret: string;
    jwtExpiration: string;
    mapboxAccessToken?: string;
}

export function resolveDatabaseUrl(): string {
    if (process.env.DATABASE_URL) {
        return process.env.DATABASE_URL;
    }
    const host = process.env.DB_HOST ?? 'localhost';
    const port = process.env.DB_PORT ?? '3306';
    const user = process.env.DB_USER ?? 'urban';
    const password = process.env.DB_PASSWORD ?? '';
    const name = process.env.DB_NAME ?? 'logistic';
    const encodedUser = encodeURIComponent(user);
    const encodedPassword = encodeURIComponent(password);
    return `mysql://${encodedUser}:${encodedPassword}@${host}:${port}/${name}`;
}

export function loadEnvConfig(): AppEnv {
    const databaseUrl = resolveDatabaseUrl();
    const jwtSecret = process.env.JWT_SECRET;

    if (!databaseUrl) {
        throw new Error('DATABASE_URL or DB_* variables are required');
    }
    if (!jwtSecret) {
        throw new Error('JWT_SECRET is required');
    }

    const port = Number(process.env.PORT ?? 3001);
    if (!Number.isFinite(port) || port <= 0) {
        throw new Error('PORT must be a positive number');
    }

    return {
        nodeEnv: process.env.NODE_ENV ?? 'development',
        port,
        databaseUrl,
        jwtSecret,
        jwtExpiration: process.env.JWT_EXPIRATION ?? '7d',
        mapboxAccessToken: process.env.MAPBOX_ACCESS_TOKEN,
    };
}
