import { Injectable, Scope } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

export interface TenantContext {
  tenantId: string;
  schema: string;
}

/**
 * Service to manage the current tenant context
 * Uses AsyncLocalStorage to maintain tenant context across async operations
 * Scoped to REQUEST level for proper tenant isolation
 */
@Injectable({ scope: Scope.DEFAULT })
export class TenantContextService {
  private readonly asyncLocalStorage = new AsyncLocalStorage<TenantContext>();

  /**
   * Set the current tenant context
   * @param context The tenant context to set
   */
  setContext(context: TenantContext): void {
    this.asyncLocalStorage.enterWith(context);
  }

  /**
   * Get the current tenant context
   * @returns The current tenant context or undefined if no context is set
   */
  getContext(): TenantContext | undefined {
    return this.asyncLocalStorage.getStore();
  }

  /**
   * Get the current tenant ID
   * @returns The current tenant ID or undefined if no context is set
   */
  getCurrentTenantId(): string | undefined {
    return this.getContext()?.tenantId;
  }

  /**
   * Get the current schema
   * @returns The current schema or 'public' if no context is set
   */
  getCurrentSchema(): string {
    return this.getContext()?.schema || 'public';
  }

  /**
   * Run a function within a tenant context
   * @param context The tenant context to use
   * @param fn The function to run within the tenant context
   * @returns The result of the function
   */
  async runWithContext<T>(context: TenantContext, fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.asyncLocalStorage.run(context, async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    });
  }
}