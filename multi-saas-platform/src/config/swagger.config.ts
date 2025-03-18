import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';
import { ApiVersion } from '../common/versioning/api-versioning.config';

/**
 * Configures Swagger documentation for the application
 * @param app NestJS application instance
 */
export function setupSwagger(app: INestApplication): void {
  // Base configuration for all API versions
  const baseConfig = new DocumentBuilder()
    .setTitle('Multi-Tenant SaaS API')
    .setDescription(`
      API documentation for multi-tenant SaaS platform.
      
      ## Authentication
      Most endpoints require a valid JWT token obtained via the /auth/login endpoint.
      
      ## Tenant Context
      Multi-tenant endpoints require a valid tenant context, which is determined by:
      - The 'x-tenant-id' header in the request
      - The tenant associated with the authenticated user
      
      ## Versioning
      API versioning is handled through the URI path:
      - V1 API (Current): \`/api/v1/resource\`
      - V2 API (When available): \`/api/v2/resource\`
    `)
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter your JWT token',
        in: 'header',
      },
      'access-token',
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-tenant-id',
        in: 'header',
        description: 'Optional tenant identifier for multi-tenant operations',
      },
      'tenant-id',
    );

  // Create separate documentation for each API version
  const versions = Object.values(ApiVersion);
  versions.forEach(version => {
    const config = baseConfig
      .setVersion(`${version}.0.0`)
      .addTag('auth', 'Authentication endpoints')
      .addTag('users', 'User management endpoints')
      .addTag('tenants', 'Tenant management endpoints')
      .build();

    const document = SwaggerModule.createDocument(app, config, {
      include: [], // Will be filled in with module controllers
      deepScanRoutes: true,
      ignoreGlobalPrefix: false,
    });

    SwaggerModule.setup(`api/v${version}/docs`, app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    });
  });

  // Setup combined documentation under the main docs endpoint
  const mainConfig = baseConfig
    .setVersion('1.0.0')
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management endpoints')
    .addTag('tenants', 'Tenant management endpoints')
    .build();

  const mainDocument = SwaggerModule.createDocument(app, mainConfig, {
    deepScanRoutes: true,
    ignoreGlobalPrefix: false,
  });

  SwaggerModule.setup('api/docs', app, mainDocument, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });
}