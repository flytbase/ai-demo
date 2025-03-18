import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedCommand } from './seed.command';
import { AuthSeeder } from '../modules/auth/seeders/auth.seeder';
import { Role } from '../modules/auth/entities/role.entity';
import { Permission } from '../modules/auth/entities/permission.entity';
import { User } from '../modules/user/entities/user.entity';
import { TenantModule } from '../modules/tenant/tenant.module';

/**
 * Module for CLI commands
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Role, Permission, User]),
    TenantModule,
  ],
  providers: [SeedCommand, AuthSeeder],
})
export class CommandsModule {}