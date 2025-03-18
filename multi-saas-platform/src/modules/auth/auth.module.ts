import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module';
import { TenantModule } from '../tenant/tenant.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RoleService } from './services/role.service';
import { PermissionService } from './services/permission.service';
import { RefreshTokenService } from './services/refresh-token.service';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { PermissionsGuard } from '../guards/permissions.guard';

/**
 * Authentication and authorization module
 * Provides user authentication, token management, and access control
 */
@Module({
  imports: [
    // Passport configuration
    PassportModule.register({ defaultStrategy: 'jwt' }),
    
    // JWT configuration
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('jwt.secret') || 'dev_secret_change_in_production',
        signOptions: {
          expiresIn: configService.get('jwt.expiresIn') || '1h',
        },
      }),
    }),
    
    // Entity repositories
    TypeOrmModule.forFeature([Role, Permission, RefreshToken]),
    
    // Required modules
    UserModule,
    TenantModule,
  ],
  controllers: [AuthController],
  providers: [
    // Core services
    AuthService,
    JwtStrategy,
    
    // RBAC services
    RoleService,
    PermissionService,
    RefreshTokenService,
    
    // Guards
    JwtAuthGuard,
    RolesGuard,
    PermissionsGuard,
  ],
  exports: [
    AuthService,
    JwtStrategy,
    RoleService,
    PermissionService,
    RefreshTokenService,
    JwtAuthGuard,
    RolesGuard,
    PermissionsGuard,
  ],
})
export class AuthModule {}