import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Guard that checks if user has required roles
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  /**
   * Check if user has required roles
   * @param context Execution context
   * @returns Boolean indicating if access is allowed
   */
  canActivate(context: ExecutionContext): boolean {
    // Get required roles from handler and controller
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Allow access if no roles are required
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Get the user from the request
    const { user } = context.switchToHttp().getRequest();
    
    // Check if user exists
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Check if user has any of the required roles
    return this.hasRole(user.roles || [], requiredRoles);
  }

  /**
   * Check if user roles include any of the required roles
   * @param userRoles User's roles
   * @param requiredRoles Required roles
   * @returns Boolean indicating if user has at least one required role
   */
  private hasRole(
    userRoles: string[],
    requiredRoles: string[],
  ): boolean {
    return requiredRoles.some(role => userRoles.includes(role));
  }
}