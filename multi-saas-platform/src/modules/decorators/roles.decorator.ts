import { SetMetadata } from '@nestjs/common';

/**
 * Key for role requirement metadata
 */
export const ROLES_KEY = 'roles';

/**
 * Decorator to require specific roles for a route
 * @param roles List of role names required
 * @example @Roles('admin', 'manager')
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);