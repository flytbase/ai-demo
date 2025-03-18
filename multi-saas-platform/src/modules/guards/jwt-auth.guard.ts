import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';

/**
 * JWT authentication guard
 * Protects routes from unauthorized access
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  /**
   * Determine if the current route requires authentication
   * @param context Execution context
   * @returns Boolean indicating if authentication should be activated
   */
  canActivate(context: ExecutionContext) {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Skip authentication for public routes
    if (isPublic) {
      return true;
    }

    // Process JWT authentication
    return super.canActivate(context);
  }

  /**
   * Handle unauthorized requests
   * @param err Error object
   * @param user User object
   * @returns User object
   */
  handleRequest(err: any, user: any) {
    // Throw an exception if authentication failed
    if (err || !user) {
      throw err || new UnauthorizedException('Authentication required');
    }

    // Return the authenticated user
    return user;
  }
}