import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../../user/user.service';
import { TenantContextService } from '../../tenant/tenant-context.service';

/**
 * JWT token payload interface
 */
export interface JwtPayload {
  sub: number;
  email: string;
  tenantId?: string;
  roles?: string[];
  permissions?: string[];
  iat?: number;
  exp?: number;
}

/**
 * JWT authentication strategy
 * Validates and processes JWT tokens
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly tenantContextService: TenantContextService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('jwt.secret'),
      passReqToCallback: true,
    });
  }

  /**
   * Validate JWT payload and return user data
   * @param req Express request
   * @param payload JWT payload
   * @returns User data
   */
  async validate(req: any, payload: JwtPayload) {
    const { sub: userId, tenantId } = payload;

    // Set tenant context if present in the JWT
    if (tenantId) {
      this.tenantContextService.setContext({
        tenantId,
        schema: `tenant_${tenantId}`,
      });
    }

    // Get user from database
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is deactivated');
    }

    // Return user data with additional JWT payload info
    return {
      ...user,
      roles: payload.roles || [],
      permissions: payload.permissions || [],
    };
  }
}