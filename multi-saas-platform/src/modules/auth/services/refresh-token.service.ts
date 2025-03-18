import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefreshToken } from '../entities/refresh-token.entity';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { TenantContextService } from '../../tenant/tenant-context.service';
import { User } from '../../user/entities/user.entity';

/**
 * Service for managing refresh tokens
 */
@Injectable()
export class RefreshTokenService {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  /**
   * Create a new refresh token for a user
   * @param user User entity
   * @param ipAddress User's IP address
   * @param userAgent User's browser agent string
   * @returns Created refresh token
   */
  async createRefreshToken(
    user: User,
    ipAddress: string,
    userAgent: string,
  ): Promise<RefreshToken> {
    // Generate token value
    const token = uuidv4();
    
    // Calculate expiration (from config, default 30 days)
    const expiresIn = this.configService.get('jwt.refreshExpiresIn') || '30d';
    const expiresAt = this.calculateExpiryDate(expiresIn);
    
    // Get tenant context
    const tenantId = this.tenantContextService.getCurrentTenantId();
    
    // Create refresh token entity
    const refreshToken = this.refreshTokenRepository.create({
      token,
      expiresAt,
      userId: user.id,
      tenantId: tenantId !== 'public' ? tenantId : undefined,
      ipAddress,
      userAgent,
    });
    
    return this.refreshTokenRepository.save(refreshToken);
  }

  /**
   * Find a refresh token by its value
   * @param token Token value
   * @returns RefreshToken entity or undefined
   */
  async findByToken(token: string): Promise<RefreshToken | undefined> {
    return this.refreshTokenRepository.findOne({
      where: { token },
      relations: ['user'],
    });
  }

  /**
   * Revoke a refresh token
   * @param token Token value or entity
   */
  async revokeRefreshToken(token: string | RefreshToken): Promise<void> {
    const refreshToken = typeof token === 'string'
      ? await this.findByToken(token)
      : token;
    
    if (refreshToken) {
      refreshToken.isRevoked = true;
      await this.refreshTokenRepository.save(refreshToken);
    }
  }

  /**
   * Revoke all refresh tokens for a user
   * @param userId User ID
   */
  async revokeAllUserTokens(userId: number): Promise<void> {
    const tokens = await this.refreshTokenRepository.find({
      where: { userId },
    });
    
    for (const token of tokens) {
      token.isRevoked = true;
    }
    
    await this.refreshTokenRepository.save(tokens);
  }

  /**
   * Delete expired tokens (can be used in a scheduled task)
   */
  async deleteExpiredTokens(): Promise<number> {
    const now = new Date();
    const result = await this.refreshTokenRepository.delete({
      expiresAt: { $lt: now },
    });
    
    return result.affected || 0;
  }

  /**
   * Verify and use a refresh token to generate a new access token
   * @param token Refresh token value
   * @returns New access token and refresh token
   */
  async useRefreshToken(token: string): Promise<{ accessToken: string, refreshToken: string }> {
    // Find refresh token
    const refreshToken = await this.findByToken(token);
    
    // Validate token
    if (!refreshToken || !refreshToken.isValid()) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    
    // Revoke the used token (one-time use)
    await this.revokeRefreshToken(refreshToken);
    
    // Set tenant context
    if (refreshToken.tenantId) {
      this.tenantContextService.setContext({
        tenantId: refreshToken.tenantId,
        schema: `tenant_${refreshToken.tenantId}`,
      });
    }
    
    // Create new tokens
    const user = refreshToken.user;
    
    // Extract role and permissions
    const userRoles = user.role ? [user.role.name] : [];
    const userPermissions = user.role?.permissions?.map(p => p.name) || [];
    
    // Create JWT payload
    const payload = {
      sub: user.id,
      email: user.email,
      tenantId: refreshToken.tenantId,
      roles: userRoles,
      permissions: userPermissions,
    };
    
    // Generate new access token
    const accessToken = this.jwtService.sign(payload);
    
    // Create new refresh token
    const newRefreshToken = await this.createRefreshToken(
      user,
      refreshToken.ipAddress,
      refreshToken.userAgent,
    );
    
    return {
      accessToken,
      refreshToken: newRefreshToken.token,
    };
  }

  /**
   * Calculate expiry date from string like '30d' or '24h'
   * @param expiresIn Expiration string
   * @returns Date object representing expiration
   */
  private calculateExpiryDate(expiresIn: string): Date {
    const now = new Date();
    const unit = expiresIn.charAt(expiresIn.length - 1);
    const value = parseInt(expiresIn.slice(0, -1));
    
    switch (unit) {
      case 'd': // days
        return new Date(now.getTime() + value * 24 * 60 * 60 * 1000);
      case 'h': // hours
        return new Date(now.getTime() + value * 60 * 60 * 1000);
      case 'm': // minutes
        return new Date(now.getTime() + value * 60 * 1000);
      case 's': // seconds
        return new Date(now.getTime() + value * 1000);
      default:
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // default 30 days
    }
  }
}