import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';

/**
 * Guard that checks if user has required permissions
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  /**
   * Check if user has required permissions
   * @param context Execution context
   * @returns Boolean indicating if access is allowed
   */
  canActivate(context: ExecutionContext): boolean {
    // Get required permissions from handler and controller
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Allow access if no permissions are required
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    // Get the user from the request
    const { user } = context.switchToHttp().getRequest();
    
    // Check if user exists
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Check if user has the required permissions
    return this.hasPermissions(user.permissions || [], requiredPermissions);
  }

  /**
   * Check if user permissions include required permissions
   * @param userPermissions User's permissions
   * @param requiredPermissions Required permissions
   * @returns Boolean indicating if user has all required permissions
   */
  private hasPermissions(
    userPermissions: string[],
    requiredPermissions: string[],
  ): boolean {
    return requiredPermissions.every(permission =>
      userPermissions.includes(permission),
    );
  }
}