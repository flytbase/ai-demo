import { DynamicModule, Inject, Module, OnModuleInit, Provider } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Connection, DataSource, DataSourceOptions, EntityTarget, ObjectLiteral, Repository } from 'typeorm';
import { TenantContextService } from '../modules/tenant/tenant-context.service';
import { TenantNamingStrategy } from './schemas/tenant-naming-strategy';
import { TenantService } from '../modules/tenant/tenant.service';
import { Tenant } from '../modules/tenant/entities/tenant.entity';
import { TYPEORM_CONNECTION } from '@nestjs/typeorm/dist/typeorm.constants';

/**
 * Multi-tenant TypeORM module
 * Provides dynamic schema switching based on tenant context
 */
@Module({})
export class MultiTenantTypeOrmModule implements OnModuleInit {
  constructor(
    @Inject(TYPEORM_CONNECTION) private readonly connection: Connection,
    private readonly tenantContextService: TenantContextService,
    private readonly tenantService: TenantService
  ) {}

  /**
   * Called when module is initialized
   * Registers event handlers for tenant schema creation
   */
  async onModuleInit() {
    // Ensure schemas exist for all tenants
    await this.initializeTenantSchemas();
  }

  /**
   * Static method to register the multi-tenant TypeORM module
   * @param options Additional TypeORM module options
   * @returns Dynamic module configuration
   */
  static forRoot(options?: Partial<TypeOrmModuleOptions>): DynamicModule {
    return {
      module: MultiTenantTypeOrmModule,
      imports: [
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => ({
            type: 'postgres',
            host: configService.get('database.host'),
            port: configService.get('database.port'),
            username: configService.get('database.username'),
            password: configService.get('database.password'),
            database: configService.get('database.database'),
            entities: [Tenant, ...options?.entities || []],
            autoLoadEntities: options?.autoLoadEntities || true,
            synchronize: options?.synchronize || configService.get('NODE_ENV') !== 'production',
            logging: options?.logging || configService.get('NODE_ENV') !== 'production',
            namingStrategy: options?.namingStrategy,
          }),
        }),
      ],
      providers: [
        {
          provide: TenantNamingStrategy,
          useFactory: (tenantContextService: TenantContextService) => {
            return new TenantNamingStrategy(tenantContextService);
          },
          inject: [TenantContextService],
        },
      ],
      exports: [TypeOrmModule],
    };
  }

  /**
   * Static method to register entity repositories for multi-tenant entities
   * @param entities Array of entity classes
   * @returns Dynamic module configuration
   */
  static forFeature(entities: EntityTarget<any>[]): DynamicModule {
    return {
      module: MultiTenantTypeOrmModule,
      imports: [TypeOrmModule.forFeature(entities)],
      providers: [
        ...entities.map(entity => {
          return {
            provide: `TENANT_REPOSITORY_${entity.name}`,
            useFactory: (connection: Connection, tenantContextService: TenantContextService) => {
              return new TenantAwareRepository(connection, entity, tenantContextService);
            },
            inject: [TYPEORM_CONNECTION, TenantContextService],
          };
        }),
      ],
      exports: [
        TypeOrmModule,
        ...entities.map(entity => `TENANT_REPOSITORY_${entity.name}`),
      ],
    };
  }

  /**
   * Initialize schemas for all existing tenants
   * @private
   */
  private async initializeTenantSchemas() {
    try {
      // Get all active tenants
      const tenants = await this.tenantService.findAll();
      
      // Create schema for each tenant if it doesn't exist
      for (const tenant of tenants) {
        const schema = tenant.schema || `tenant_${tenant.id}`;
        
        // Update tenant with schema if not already set
        if (!tenant.schema) {
          await this.tenantService.update(tenant.id, { schema });
        }
        
        // Create schema if it doesn't exist
        await this.connection.query(`CREATE SCHEMA IF NOT EXISTS ${schema}`);
      }
      
      console.log(`Initialized schemas for ${tenants.length} tenants`);
    } catch (error) {
      console.error('Failed to initialize tenant schemas:', error);
    }
  }
}

/**
 * Tenant-aware repository
 * Automatically applies the current tenant's schema to all operations
 */
class TenantAwareRepository<Entity extends ObjectLiteral> {
  private repository: Repository<Entity>;
  
  constructor(
    private connection: Connection,
    private entity: EntityTarget<Entity>,
    private tenantContextService: TenantContextService
  ) {
    this.repository = connection.getRepository(entity);
  }
  
  /**
   * Get the repository for the current tenant
   * @returns Repository instance
   */
  getRepository(): Repository<Entity> {
    // Apply tenant schema to the repository
    const schema = this.tenantContextService.getCurrentSchema();
    return this.repository.extend({
      createQueryBuilder(alias?: string) {
        const qb = this.repository.createQueryBuilder(alias);
        qb.expressionMap.schema = schema;
        return qb;
      },
    });
  }
}