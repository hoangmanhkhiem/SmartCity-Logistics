import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Global prefix
    app.setGlobalPrefix('api/v1');

    // Validation pipe
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            transformOptions: {
                enableImplicitConversion: true,
            },
        }),
    );

    // CORS
    app.enableCors({
        origin: true,
        credentials: true,
    });

    // Swagger documentation
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
        .addTag('routes', 'Route management')
        .addTag('telemetry', 'Telemetry data')
        .addTag('research', 'Research / field collection data')
        .addTag('partner', 'B2B partner API (X-Api-Key)')
        .addTag('integrations', 'API keys for partners')
        .addTag('dispatch', 'Dispatch & assignment')
        .addTag('quotes', 'Carrier quote comparison')
        .addTag('analytics', 'Platform analytics')
        .addTag('drivers', 'Drivers')
        .addTag('tracking', 'Public shipment tracking')
        .addApiKey(
            { type: 'apiKey', name: 'X-Api-Key', in: 'header', description: 'Partner integration key' },
            'partner-api-key',
        )
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api-docs', app, document);

    const port = process.env.PORT || 3000;
    await app.listen(port);
    console.log(`🚀 Application is running on: http://localhost:${port}`);
    console.log(`📚 Swagger docs available at: http://localhost:${port}/api-docs`);
}

bootstrap();
