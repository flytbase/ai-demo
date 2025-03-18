import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantService } from '../modules/tenant/tenant.service';
import { TenantContextService, TenantContext } from '../modules/tenant/tenant-context.service';

/**
 * Extend Express Request interface to include tenant context
 */
declare global {
  namespace Express {
    interface Request {
      tenantContext?: TenantContext;
    }
  }
}

/**
 * Middleware to extract tenant information from request and set tenant context
 */
@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  constructor(
    private readonly tenantService: TenantService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  /**
   * Middleware function to set tenant context
   * Extracts tenant information from headers, subdomain, or JWT token
   */
  async use(req: Request, res: Response, next: NextFunction) {
    try {
      let tenantId: string | undefined;
      let schema: string;

      // Extract tenant ID from header
      const tenantHeader = req.headers['x-tenant-id'] as string;
      if (tenantHeader) {
        tenantId = tenantHeader;
      }

      // If no tenant ID in header, extract from host (subdomain)
      if (!tenantId) {
        const host = req.headers.host;
        if (host) {
          const subdomain = host.split('.')[0];
          if (subdomain && subdomain !== 'www') {
            const tenant = await this.tenantService.findByDomain(subdomain);
            if (tenant) {
              tenantId = tenant.id;
            }
          }
        }
      }

      // Extract from JWT token if available
      if (!tenantId && req.headers.authorization) {
        try {
          // JWT extraction and validation would happen here
          // This is simplified - in a real app, you'd verify the token and extract claims
          const token = req.headers.authorization.split(' ')[1];
          if (token) {
            // Simplified example - in reality, you'd decode and verify the token
            const tokenPayload = JSON.parse(
              Buffer.from(token.split('.')[1], 'base64').toString()
            );
            if (tokenPayload.tenantId) {
              tenantId = tokenPayload.tenantId;
            }
          }
        } catch (error) {
          // If token parsing fails, just continue
          console.error('Error extracting tenant from token:', error);
        }
      }

      // If tenant ID found, get schema from tenant service
      if (tenantId) {
        const tenant = await this.tenantService.findById(tenantId);
        if (tenant) {
          schema = tenant.schema || 'public';
          
          // Create tenant context
          const context: TenantContext = {
            tenantId,
            schema,
          };
          
          // Set tenant context for the current request
          this.tenantContextService.setContext(context);
          
          // Attach tenant context to request for controllers to access
          req.tenantContext = context;
        } else {
          // Tenant ID was provided but not found - use default
          this.setDefaultContext(req);
        }
      } else {
        // No tenant ID found - use default
        this.setDefaultContext(req);
      }

      next();
    } catch (error) {
      // If any error occurs, continue with default public schema
      this.setDefaultContext(req);
      next();
    }
  }

  /**
   * Set default public schema context
   * @param req Express request
   */
  private setDefaultContext(req: Request): void {
    const context: TenantContext = {
      tenantId: 'public',
      schema: 'public',
    };
    
    this.tenantContextService.setContext(context);
    req.tenantContext = context;
  }
}