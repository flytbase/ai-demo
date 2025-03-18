import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import helmet from 'helmet';
import * as compression from 'compression';
import { AppModule } from './app.module';
import { TenantContextService } from './modules/tenant/tenant-context.service';
import { TenantGuard } from './common/guards/tenant.guard';
import { setupSwagger } from './config/swagger.config';
import { ApiExceptionFilter } from './common/filters/api-exception.filter';
import { ApiVersion } from './common/versioning/api-versioning.config';

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

  // Global exception filter for standardized API responses
  app.useGlobalFilters(new ApiExceptionFilter());

  // Global tenant guard
  const tenantContextService = app.get(TenantContextService);
  app.useGlobalGuards(new TenantGuard(app.get('Reflector'), tenantContextService));

  // CORS configuration
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id', 'X-API-Version'],
    exposedHeaders: ['X-API-Version'],
  });

  // Configure API versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: ApiVersion.V1,
    prefix: 'api/v',
  });

  // Swagger API documentation
  if (process.env.NODE_ENV !== 'production') {
    setupSwagger(app);
  }

  // Start the application
  const port = process.env.PORT || 3000;
  await app.listen(port, () => {
    console.log(`Application running on port ${port}`);
    console.log(`API documentation available at http://localhost:${port}/api/docs`);
    console.log(`V1 API documentation: http://localhost:${port}/api/v1/docs`);
    console.log(`V2 API documentation: http://localhost:${port}/api/v2/docs`);
  });
}
bootstrap();