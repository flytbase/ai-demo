# Multi-Tenant Architecture

This document describes the multi-tenant architecture implemented in our NestJS-based SaaS platform. It covers the technical approach, design decisions, and usage patterns.

## Overview

The platform uses a schema-based multi-tenancy approach in PostgreSQL, where each tenant's data is isolated in a separate database schema. This provides strong data isolation while maintaining the operational simplicity of a single database.

## Key Components

### 1. Tenant Context Management

- The `TenantContextService` uses NodeJS's `AsyncLocalStorage` to maintain tenant context across asynchronous operations
- Tenant context includes the tenant ID and associated database schema
- The context is accessed through a service that provides methods to get the current tenant or run code within a specific tenant context

```typescript
// Example: Getting current tenant context
const tenantId = tenantContextService.getCurrentTenantId();
const schema = tenantContextService.getCurrentSchema();
```

### 2. Dynamic Tenant Resolution

- The `TenantContextMiddleware` extracts tenant information from:
  - HTTP headers (`x-tenant-id`)
  - Subdomain (e.g., `tenant1.example.com`)
  - JWT tokens (tenant claims)
- The middleware sets the tenant context for the duration of the request
- Public endpoints can be excluded from tenant resolution

### 3. Schema-Based Data Isolation

- Each tenant's data is stored in a dedicated PostgreSQL schema
- The `TenantNamingStrategy` extends TypeORM's naming strategy to prefix table names with the current tenant's schema
- Database queries automatically target the correct tenant schema based on the current context

### 4. Entity Design

- Base entity classes provide common fields across all entities
- The `BaseEntity` includes `id`, `createdAt`, and `updatedAt` fields
- The `TenantBaseEntity` extends the base entity with a `tenantId` field for explicit tenant association

### 5. Schema Management

- The `SchemaService` provides methods to:
  - Create schemas for new tenants
  - Check if a schema exists
  - Drop schemas when tenants are deleted
  - Create tenant-specific database roles with appropriate permissions

### 6. Access Control

- The `TenantGuard` ensures that requests have a valid tenant context
- Routes can be marked as public to bypass tenant checks using the `@Public()` decorator
- The `@Tenant()` and `@CurrentTenantId()` decorators provide easy access to tenant context in controllers

## Usage Examples

### Creating a New Tenant

```typescript
// In TenantService
async create(createTenantDto: CreateTenantDto): Promise<Tenant> {
  // Create tenant record with auto-generated schema name
  const tenant = this.tenantRepository.create({
    ...createTenantDto,
    schema: `tenant_${createTenantDto.domain.replace(/[^a-zA-Z0-9]/g, '_')}`,
  });
  
  // Save tenant record
  const savedTenant = await this.tenantRepository.save(tenant);
  
  // Create schema for new tenant
  await this.schemaService.createSchema(savedTenant.schema!);
  
  return savedTenant;
}
```

### Querying within Tenant Context

```typescript
// In UserService
async findByEmail(email: string): Promise<User | undefined> {
  const tenantId = this.tenantContextService.getCurrentTenantId();
  const query = this.userRepository.createQueryBuilder('user')
    .where('user.email = :email', { email });
  
  // Apply tenant filter if in tenant context
  if (tenantId && tenantId !== 'public') {
    query.andWhere('user.tenantId = :tenantId', { tenantId });
  }
  
  return query.getOne();
}
```

### Securing Controller Endpoints

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { TenantGuard, Public } from '../common/guards/tenant.guard';
import { CurrentTenantId } from '../common/decorators/tenant.decorator';

@Controller('users')
@UseGuards(TenantGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async findAll(@CurrentTenantId() tenantId: string) {
    // Automatically filtered by tenant
    return this.userService.findAll();
  }

  @Public()
  @Get('public')
  async publicEndpoint() {
    // Accessible without tenant context
    return { message: 'Public endpoint' };
  }
}
```

## Best Practices

1. **Always use the tenant context service** to determine the current tenant, rather than hardcoding tenant IDs
2. **Apply tenant filtering in repositories** to ensure data isolation
3. **Use the tenant guard** on all routes that should be tenant-specific
4. **Be cautious with cross-tenant operations** that may violate isolation
5. **Test thoroughly** with multiple tenant contexts to ensure proper isolation

## Technical Considerations

- **Connection Pooling**: The database connection is shared across tenants with schema selection happening at query time
- **Transaction Management**: Transactions work normally within a tenant's schema
- **Performance**: Schema-based isolation adds minimal overhead compared to separate databases
- **Scaling**: This approach works well up to hundreds or thousands of tenants