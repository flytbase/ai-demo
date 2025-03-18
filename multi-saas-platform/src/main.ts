import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import * as compression from 'compression';
import { AppModule } from './app.module';
import { TenantContextService } from './modules/tenant/tenant-context.service';
import { TenantGuard } from './common/guards/tenant.guard';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security middleware
  app.use(helmet());

  // Compression middleware
  app.use(compression());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global tenant guard
  const tenantContextService = app.get(TenantContextService);
  app.useGlobalGuards(new TenantGuard(app.get('Reflector'), tenantContextService));

  // CORS configuration
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id'],
  });

  // Global prefix for API
  app.setGlobalPrefix('api/v1');

  // Swagger API documentation
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Multi-Tenant SaaS API')
      .setDescription('API documentation for multi-tenant SaaS platform')
      .setVersion('1.0')
      .addTag('auth', 'Authentication endpoints')
      .addTag('users', 'User management endpoints')
      .addTag('tenants', 'Tenant management endpoints')
      .addBearerAuth()
      .build();
    
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  // Start the application
  const port = process.env.PORT || 3000;
  await app.listen(port, () => {
    console.log(`Application running on port ${port}`);
    console.log(`API documentation available at http://localhost:${port}/api/docs`);
  });
}
bootstrap();