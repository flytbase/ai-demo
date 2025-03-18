import { Module, Global } from '@nestjs/common';
import { SchemaService } from './schema.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TenantNamingStrategy } from './schemas/tenant-naming-strategy';
import { TenantContextService } from '../modules/tenant/tenant-context.service';
import { Tenant } from '../modules/tenant/entities/tenant.entity';
import { User } from '../modules/user/entities/user.entity';

/**
 * Global database module
 * Provides TypeORM connection, schema management, and tenant context services
 */
@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService, TenantContextService],
      useFactory: (configService: ConfigService, tenantContextService: TenantContextService) => ({
        type: 'postgres',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.database'),
        entities: [Tenant, User],
        autoLoadEntities: true,
        synchronize: configService.get('NODE_ENV') !== 'production',
        logging: configService.get('NODE_ENV') !== 'production',
        namingStrategy: new TenantNamingStrategy(tenantContextService),
      }),
    }),
  ],
  providers: [SchemaService],
  exports: [SchemaService],
})
export class DatabaseModule {}