import { SetMetadata } from '@nestjs/common';

/**
 * Key for permission requirement metadata
 */
export const PERMISSIONS_KEY = 'permissions';

/**
 * Decorator to require specific permissions for a route
 * @param permissions List of permission strings required
 * @example @RequirePermissions('users:read', 'users:create')
 */
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);