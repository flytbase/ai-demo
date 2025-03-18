import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user/user.service';
import { TenantContextService } from '../tenant/tenant-context.service';
import { RoleService } from './services/role.service';
import { PermissionService } from './services/permission.service';
import { RefreshTokenService } from './services/refresh-token.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { User } from '../user/entities/user.entity';
import { JwtPayload } from './strategies/jwt.strategy';
import * as bcrypt from 'bcrypt';

/**
 * Auth response interface
 */
interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: Partial<User>;
}

/**
 * Main authentication service
 * Handles user registration, login, and token management
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly tenantContextService: TenantContextService,
    private readonly roleService: RoleService,
    private readonly permissionService: PermissionService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  /**
   * Register a new user
   * @param registerDto User registration data
   * @param ipAddress User's IP address
   * @param userAgent User's browser agent string
   * @returns Auth response with tokens and user data
   */
  async register(
    registerDto: RegisterDto,
    ipAddress: string,
    userAgent: string,
  ): Promise<AuthResponse> {
    // If tenant ID provided, set tenant context
    if (registerDto.tenantId) {
      this.tenantContextService.setContext({
        tenantId: registerDto.tenantId,
        schema: `tenant_${registerDto.tenantId}`,
      });
    }

    // Check if email is already in use
    const existingUser = await this.userService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    // If no role provided, use default role for tenant
    let roleId = registerDto.roleId;
    if (!roleId && registerDto.tenantId) {
      const defaultRole = await this.roleService.findOrCreateDefaultRole(registerDto.tenantId);
      roleId = defaultRole.id;
    }

    // Create the user
    const user = await this.userService.create({
      ...registerDto,
      roleId,
      isEmailVerified: false, // Require verification
    });

    // Generate tokens
    return this.generateAuthResponse(user, ipAddress, userAgent);
  }

  /**
   * Authenticate user and generate tokens
   * @param loginDto Login credentials
   * @param ipAddress User's IP address
   * @param userAgent User's browser agent string
   * @returns Auth response with tokens and user data
   */
  async login(
    loginDto: LoginDto,
    ipAddress: string,
    userAgent: string,
  ): Promise<AuthResponse> {
    // If tenant ID provided, set tenant context
    if (loginDto.tenantId) {
      this.tenantContextService.setContext({
        tenantId: loginDto.tenantId,
        schema: `tenant_${loginDto.tenantId}`,
      });
    }

    // Validate credentials
    const user = await this.validateCredentials(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login timestamp
    await this.userService.update(user.id, { lastLoginAt: new Date() });

    // Generate tokens
    return this.generateAuthResponse(user, ipAddress, userAgent);
  }

  /**
   * Refresh auth tokens using a refresh token
   * @param refreshTokenDto Refresh token data
   * @param ipAddress User's IP address
   * @param userAgent User's browser agent string
   * @returns New auth tokens
   */
  async refreshToken(
    refreshTokenDto: RefreshTokenDto,
    ipAddress: string,
    userAgent: string,
  ): Promise<AuthResponse> {
    // If tenant ID provided, set tenant context
    if (refreshTokenDto.tenantId) {
      this.tenantContextService.setContext({
        tenantId: refreshTokenDto.tenantId,
        schema: `tenant_${refreshTokenDto.tenantId}`,
      });
    }

    // Use refresh token to get new tokens
    const tokens = await this.refreshTokenService.useRefreshToken(refreshTokenDto.refreshToken);
    
    // Find the user
    const refreshToken = await this.refreshTokenService.findByToken(tokens.refreshToken);
    if (!refreshToken) {
      throw new UnauthorizedException('Invalid token');
    }
    
    // Get the user with role and permissions
    const user = await this.userService.findById(refreshToken.userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Get expiration time
    const expiresIn = this.getTokenExpirationTime();

    // Return auth response
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn,
      user: this.sanitizeUser(user),
    };
  }

  /**
   * Validate user credentials
   * @param email User email
   * @param password User password
   * @returns User entity if valid, null otherwise
   */
  async validateCredentials(email: string, password: string): Promise<User | null> {
    // Find user by email
    const user = await this.userService.findByEmail(email);
    if (!user) {
      return null;
    }

    // Check if account is active
    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  /**
   * Logout user by revoking their refresh tokens
   * @param userId User ID
   */
  async logout(userId: number): Promise<void> {
    await this.refreshTokenService.revokeAllUserTokens(userId);
  }

  /**
   * Generate authentication response with tokens and user data
   * @param user User entity
   * @param ipAddress User's IP address
   * @param userAgent User's browser agent string
   * @returns Auth response
   */
  private async generateAuthResponse(
    user: User,
    ipAddress: string,
    userAgent: string,
  ): Promise<AuthResponse> {
    // Create refresh token
    const refreshToken = await this.refreshTokenService.createRefreshToken(
      user,
      ipAddress,
      userAgent,
    );

    // Extract roles and permissions
    const roles = user.role ? [user.role.name] : [];
    const permissions = user.role?.permissions?.map(p => p.name) || [];

    // Create JWT payload
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      roles,
      permissions,
    };

    // Generate access token
    const accessToken = this.jwtService.sign(payload);

    // Get expiration time
    const expiresIn = this.getTokenExpirationTime();

    // Return auth response
    return {
      accessToken,
      refreshToken: refreshToken.token,
      expiresIn,
      user: this.sanitizeUser(user),
    };
  }

  /**
   * Get token expiration time in seconds
   */
  private getTokenExpirationTime(): number {
    const expiration = this.configService.get('jwt.expiresIn') || '1h';
    
    // Parse expiration string (e.g., '1h', '30m')
    const unit = expiration.charAt(expiration.length - 1);
    const value = parseInt(expiration.slice(0, -1), 10);
    
    // Convert to seconds
    switch (unit) {
      case 'd': return value * 24 * 60 * 60;
      case 'h': return value * 60 * 60;
      case 'm': return value * 60;
      case 's': return value;
      default: return 3600; // Default 1 hour
    }
  }

  /**
   * Remove sensitive data from user object
   * @param user User entity
   * @returns Sanitized user object
   */
  private sanitizeUser(user: User): Partial<User> {
    const { password, ...sanitizedUser } = user;
    return sanitizedUser;
  }
}