import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Custom decorator to extract tenant context from request
 * Usage: @Tenant() tenantContext: TenantContext
 */
export const Tenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    
    // Access the tenant context set by the middleware
    return request.tenantContext;
  },
);

/**
 * Custom decorator to extract current tenant ID from request
 * Usage: @CurrentTenantId() tenantId: string
 */
export const CurrentTenantId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    
    // Access the tenant ID from the context set by the middleware
    return request.tenantContext?.tenantId;
  },
);