import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../entities/role.entity';
import { TenantContextService } from '../../tenant/tenant-context.service';

/**
 * Service for managing roles
 */
@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private readonly tenantContextService: TenantContextService,
  ) {}

  /**
   * Find a role by ID within the current tenant context
   * @param id Role ID
   * @returns Role entity or undefined
   */
  async findById(id: string): Promise<Role | undefined> {
    const tenantId = this.tenantContextService.getCurrentTenantId();
    const query = this.roleRepository.createQueryBuilder('role')
      .leftJoinAndSelect('role.permissions', 'permissions')
      .where('role.id = :id', { id });
    
    // Apply tenant filter if in tenant context, or include global roles
    if (tenantId && tenantId !== 'public') {
      query.andWhere('(role.tenantId = :tenantId OR role.isGlobal = true)', { tenantId });
    }
    
    const role = await query.getOne();
    return role || undefined;
  }

  /**
   * Find a role by name within the current tenant context
   * @param name Role name
   * @returns Role entity or undefined
   */
  async findByName(name: string): Promise<Role | undefined> {
    const tenantId = this.tenantContextService.getCurrentTenantId();
    const query = this.roleRepository.createQueryBuilder('role')
      .leftJoinAndSelect('role.permissions', 'permissions')
      .where('role.name = :name', { name });
    
    // Apply tenant filter if in tenant context, or include global roles
    if (tenantId && tenantId !== 'public') {
      query.andWhere('(role.tenantId = :tenantId OR role.isGlobal = true)', { tenantId });
    }
    
    const role = await query.getOne();
    return role || undefined;
  }

  /**
   * Create a new role in the current tenant context
   * @param roleData Partial role data
   * @returns Created role
   */
  async create(roleData: Partial<Role>): Promise<Role> {
    const tenantId = this.tenantContextService.getCurrentTenantId();
    
    // Create role with tenant ID if in tenant context
    const role = this.roleRepository.create({
      ...roleData,
      tenantId: tenantId !== 'public' ? tenantId : undefined,
    });
    
    return this.roleRepository.save(role);
  }

  /**
   * Find all roles in the current tenant context
   * @returns Array of roles
   */
  async findAll(): Promise<Role[]> {
    const tenantId = this.tenantContextService.getCurrentTenantId();
    const query = this.roleRepository.createQueryBuilder('role')
      .leftJoinAndSelect('role.permissions', 'permissions');
    
    // Apply tenant filter if in tenant context, or include global roles
    if (tenantId && tenantId !== 'public') {
      query.where('(role.tenantId = :tenantId OR role.isGlobal = true)', { tenantId });
    }
    
    return query.getMany();
  }

  /**
   * Update a role in the current tenant context
   * @param id Role ID
   * @param updateData Partial role data to update
   * @returns Updated role
   */
  async update(id: string, updateData: Partial<Role>): Promise<Role> {
    const role = await this.findById(id);
    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }
    
    // Update role properties
    Object.assign(role, updateData);
    
    return this.roleRepository.save(role);
  }

  /**
   * Delete a role
   * @param id Role ID
   * @returns True if successful
   */
  async delete(id: string): Promise<boolean> {
    const role = await this.findById(id);
    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }
    
    await this.roleRepository.remove(role);
    return true;
  }

  /**
   * Find or create default role for a tenant
   * @param tenantId Tenant ID
   * @returns Default role
   */
  async findOrCreateDefaultRole(tenantId: string): Promise<Role> {
    // Set tenant context
    this.tenantContextService.setContext({
      tenantId,
      schema: `tenant_${tenantId}`,
    });
    
    // Find existing default role
    const existingRole = await this.roleRepository.findOne({
      where: {
        isDefault: true,
        tenantId,
      },
    });
    
    if (existingRole) {
      return existingRole;
    }
    
    // Create default role if not exists
    const defaultRole = this.roleRepository.create({
      name: 'User',
      description: 'Default user role',
      isDefault: true,
      tenantId,
    });
    
    return this.roleRepository.save(defaultRole);
  }
}