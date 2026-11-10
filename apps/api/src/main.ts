import { resolveDatabaseUrl } from './config/env';
import { createHttpApp } from './http/app';

if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = resolveDatabaseUrl();
}

createHttpApp().catch((err) => {
    console.error(err);
    process.exit(1);
});
