import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantContextService } from '../../modules/tenant/tenant-context.service';

/**
 * Guard to protect routes that require tenant context
 * Will throw ForbiddenException if no tenant context is available
 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tenantContextService: TenantContextService,
  ) {}

  /**
   * Check if request has valid tenant context
   * @param context Execution context
   * @returns True if tenant context is valid or if route is public
   */
  canActivate(context: ExecutionContext): boolean {
    // Check if route is marked as public (no tenant check)
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);
    
    // Allow access to public routes
    if (isPublic) {
      return true;
    }
    
    // Get tenant context from request
    const tenantContext = this.tenantContextService.getContext();
    
    // Block access if no tenant context is available
    if (!tenantContext || !tenantContext.tenantId || tenantContext.tenantId === 'public') {
      throw new ForbiddenException('Tenant context required');
    }
    
    return true;
  }
}

/**
 * Decorator to mark routes as public (no tenant check)
 */
export const Public = () => {
  return (target: any, key?: string, descriptor?: any) => {
    Reflect.defineMetadata('isPublic', true, descriptor.value);
    return descriptor;
  };
}