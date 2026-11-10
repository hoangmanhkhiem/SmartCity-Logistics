import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { loadEnvConfig } from '../config/env';

export async function createHttpApp(): Promise<INestApplication> {
    const env = loadEnvConfig();
    const app = await NestFactory.create(AppModule);

    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            transformOptions: { enableImplicitConversion: true },
        }),
    );
    app.enableCors({ origin: true, credentials: true });

    const config = new DocumentBuilder()
        .setTitle('Urban Logistics API')
        .setDescription('API documentation for Urban Logistics System')
        .setVersion('1.0')
        .addBearerAuth()
        .addTag('auth', 'Authentication endpoints')
        .addTag('users', 'User management')
        .addTag('organizations', 'Organization management')
        .addTag('carriers', 'Carrier management')
        .addTag('vehicles', 'Vehicle management')
        .addTag('facilities', 'Facility management')
        .addTag('zones', 'Zone management')
        .addTag('orders', 'Order management')
        .addTag('routes', 'Route planning')
        .addTag('telemetry', 'Telemetry data')
        .addTag('partner', 'B2B partner API (X-Api-Key)')
        .addTag('integrations', 'API keys for partners')
        .addTag('analytics', 'Platform analytics')
        .addTag('shippers', 'Shipper management & self-service')
        .addTag('tracking', 'Public shipment tracking')
        .addTag('restrictions', 'Traffic restrictions')
        .addTag('road-segments', 'Road segments')
        .addApiKey(
            {
                type: 'apiKey',
                name: 'X-Api-Key',
                in: 'header',
                description: 'Partner integration key',
            },
            'partner-api-key',
        )
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api-docs', app, document);

    const port = env.port;
    await app.listen(port);
    console.log(`Application is running on: http://localhost:${port}`);
    console.log(`Swagger docs: http://localhost:${port}/api-docs`);

    return app;
}
