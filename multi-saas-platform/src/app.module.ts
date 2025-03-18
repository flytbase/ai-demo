import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { TenantContextModule } from './modules/tenant/tenant-context.module';
import { UserModule } from './modules/user/user.module';
import { DatabaseModule } from './database/database.module';
import { TenantContextMiddleware } from './middleware/tenant-context.middleware';
import { VersionModule } from './common/versioning/version.module';
import { VersionMiddleware } from './common/versioning/version.middleware';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import redisConfig from './config/redis.config';

@Module({
  imports: [
    // Configuration module
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      load: [databaseConfig, jwtConfig, redisConfig],
    }),

    // Tenant Context module (needs to be loaded first)
    TenantContextModule,

    // Import database module
    DatabaseModule,

    // API Versioning module
    VersionModule,

    // Application modules
    AuthModule,
    TenantModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  /**
   * Configure middleware
   * Apply middleware in the correct order:
   * 1. VersionMiddleware - to handle API versioning
   * 2. TenantContextMiddleware - to establish tenant context
   */
  configure(consumer: MiddlewareConsumer) {
    // Add versioning middleware to all routes
    consumer
      .apply(VersionMiddleware)
      .forRoutes('*');
      
    // Apply tenant context middleware except for public endpoints
    consumer
      .apply(TenantContextMiddleware)
      .exclude(
        { path: 'api/v(1|2)/auth/login', method: RequestMethod.POST },
        { path: 'api/v(1|2)/auth/register', method: RequestMethod.POST },
        { path: 'api/v(1|2)/version', method: RequestMethod.GET },
        { path: 'api/v(1|2)/health', method: RequestMethod.GET },
      )
      .forRoutes('*');
  }
}