import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../entities/role.entity';
import { Permission } from '../entities/permission.entity';
import { User } from '../../user/entities/user.entity';
import * as bcrypt from 'bcrypt';

/**
 * Service for seeding initial auth data
 * Creates default roles, permissions, and admin user
 */
@Injectable()
export class AuthSeeder {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Seed default global roles and permissions
   */
  async seedGlobalRolesAndPermissions(): Promise<void> {
    // Create default permissions
    const permissions = await this.seedPermissions();

    // Create admin role with all permissions
    const adminRole = await this.createRoleIfNotExists('admin', 'Administrator role with full access', true);
    adminRole.permissions = permissions;
    await this.roleRepository.save(adminRole);

    // Create user role with limited permissions
    const userRole = await this.createRoleIfNotExists('user', 'Standard user role with limited access', true);
    const userPermissions = permissions.filter(p => 
      p.name.includes(':read') || 
      p.name === 'profile:update'
    );
    userRole.permissions = userPermissions;
    await this.roleRepository.save(userRole);

    console.log('Global roles and permissions seeded successfully');
  }

  /**
   * Create default admin user
   * @param email Admin email
   * @param password Admin password
   */
  async seedAdminUser(email: string, password: string): Promise<void> {
    // Get admin role
    const adminRole = await this.roleRepository.findOne({
      where: { name: 'admin' },
    });

    if (!adminRole) {
      throw new Error('Admin role not found. Run seedGlobalRolesAndPermissions first.');
    }

    // Check if admin user already exists
    const existingAdmin = await this.userRepository.findOne({
      where: { email },
    });

    if (existingAdmin) {
      console.log(`Admin user ${email} already exists`);
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create admin user
    const admin = this.userRepository.create({
      email,
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      roleId: adminRole.id,
      isActive: true,
      isEmailVerified: true,
    });

    await this.userRepository.save(admin);
    console.log(`Admin user ${email} created successfully`);
  }

  /**
   * Create default permissions
   * @returns Array of created permissions
   */
  private async seedPermissions(): Promise<Permission[]> {
    const permissionDefinitions = [
      // User management
      { name: 'users:create', resource: 'users', action: 'create' },
      { name: 'users:read', resource: 'users', action: 'read' },
      { name: 'users:update', resource: 'users', action: 'update' },
      { name: 'users:delete', resource: 'users', action: 'delete' },
      
      // Role management
      { name: 'roles:create', resource: 'roles', action: 'create' },
      { name: 'roles:read', resource: 'roles', action: 'read' },
      { name: 'roles:update', resource: 'roles', action: 'update' },
      { name: 'roles:delete', resource: 'roles', action: 'delete' },
      
      // Permission management
      { name: 'permissions:create', resource: 'permissions', action: 'create' },
      { name: 'permissions:read', resource: 'permissions', action: 'read' },
      { name: 'permissions:update', resource: 'permissions', action: 'update' },
      { name: 'permissions:delete', resource: 'permissions', action: 'delete' },
      
      // Tenant management
      { name: 'tenants:create', resource: 'tenants', action: 'create' },
      { name: 'tenants:read', resource: 'tenants', action: 'read' },
      { name: 'tenants:update', resource: 'tenants', action: 'update' },
      { name: 'tenants:delete', resource: 'tenants', action: 'delete' },
      
      // Profile management
      { name: 'profile:read', resource: 'profile', action: 'read' },
      { name: 'profile:update', resource: 'profile', action: 'update' },
    ];

    const createdPermissions = [];
    
    // Create each permission if it doesn't exist
    for (const permDef of permissionDefinitions) {
      const existingPerm = await this.permissionRepository.findOne({
        where: { name: permDef.name },
      });
      
      if (existingPerm) {
        createdPermissions.push(existingPerm);
        continue;
      }

      const permission = this.permissionRepository.create({
        ...permDef,
        isGlobal: true,
      });

      const savedPermission = await this.permissionRepository.save(permission);
      createdPermissions.push(savedPermission);
    }

    return createdPermissions;
  }

  /**
   * Create a role if it doesn't exist
   * @param name Role name
   * @param description Role description
   * @param isGlobal Whether the role is global
   * @returns Created or existing role
   */
  private async createRoleIfNotExists(
    name: string,
    description: string,
    isGlobal = false,
  ): Promise<Role> {
    const existingRole = await this.roleRepository.findOne({
      where: { name },
    });

    if (existingRole) {
      return existingRole;
    }

    const role = this.roleRepository.create({
      name,
      description,
      isGlobal,
    });

    return this.roleRepository.save(role);
  }
}