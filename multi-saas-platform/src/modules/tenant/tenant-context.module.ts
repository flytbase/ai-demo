import { Module, Global } from '@nestjs/common';
import { TenantContextService } from './tenant-context.service';

/**
 * Global module for tenant context service
 * This separates the TenantContextService from other modules to prevent circular dependencies
 */
@Global()
@Module({
  providers: [TenantContextService],
  exports: [TenantContextService],
})
export class TenantContextModule {}