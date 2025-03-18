import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from '../entities/permission.entity';
import { TenantContextService } from '../../tenant/tenant-context.service';

/**
 * Service for managing permissions
 */
@Injectable()
export class PermissionService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    private readonly tenantContextService: TenantContextService,
  ) {}

  /**
   * Find a permission by ID within the current tenant context
   * @param id Permission ID
   * @returns Permission entity or undefined
   */
  async findById(id: string): Promise<Permission | undefined> {
    const tenantId = this.tenantContextService.getCurrentTenantId();
    const query = this.permissionRepository.createQueryBuilder('permission')
      .where('permission.id = :id', { id });
    
    // Apply tenant filter if in tenant context, or include global permissions
    if (tenantId && tenantId !== 'public') {
      query.andWhere('(permission.tenantId = :tenantId OR permission.isGlobal = true)', { tenantId });
    }
    
    const permission = await query.getOne();
    return permission || undefined;
  }

  /**
   * Find a permission by name
   * @param name Permission name
   * @returns Permission entity or undefined
   */
  async findByName(name: string): Promise<Permission | undefined> {
    const tenantId = this.tenantContextService.getCurrentTenantId();
    const query = this.permissionRepository.createQueryBuilder('permission')
      .where('permission.name = :name', { name });
    
    // Apply tenant filter if in tenant context, or include global permissions
    if (tenantId && tenantId !== 'public') {
      query.andWhere('(permission.tenantId = :tenantId OR permission.isGlobal = true)', { tenantId });
    }
    
    const permission = await query.getOne();
    return permission || undefined;
  }

  /**
   * Find permissions by resource and action
   * @param resource Resource name
   * @param action Action name
   * @returns Permission entities
   */
  async findByResourceAction(resource: string, action: string): Promise<Permission[]> {
    const tenantId = this.tenantContextService.getCurrentTenantId();
    const query = this.permissionRepository.createQueryBuilder('permission')
      .where('permission.resource = :resource', { resource })
      .andWhere('permission.action = :action', { action });
    
    // Apply tenant filter if in tenant context, or include global permissions
    if (tenantId && tenantId !== 'public') {
      query.andWhere('(permission.tenantId = :tenantId OR permission.isGlobal = true)', { tenantId });
    }
    
    return query.getMany();
  }

  /**
   * Create a new permission in the current tenant context
   * @param permissionData Partial permission data
   * @returns Created permission
   */
  async create(permissionData: Partial<Permission>): Promise<Permission> {
    const tenantId = this.tenantContextService.getCurrentTenantId();
    
    // Create permission with tenant ID if in tenant context
    const permission = this.permissionRepository.create({
      ...permissionData,
      tenantId: tenantId !== 'public' ? tenantId : undefined,
    });
    
    return this.permissionRepository.save(permission);
  }

  /**
   * Find all permissions in the current tenant context
   * @returns Array of permissions
   */
  async findAll(): Promise<Permission[]> {
    const tenantId = this.tenantContextService.getCurrentTenantId();
    const query = this.permissionRepository.createQueryBuilder('permission');
    
    // Apply tenant filter if in tenant context, or include global permissions
    if (tenantId && tenantId !== 'public') {
      query.where('(permission.tenantId = :tenantId OR permission.isGlobal = true)', { tenantId });
    }
    
    return query.getMany();
  }

  /**
   * Update a permission
   * @param id Permission ID
   * @param updateData Partial permission data to update
   * @returns Updated permission
   */
  async update(id: string, updateData: Partial<Permission>): Promise<Permission> {
    const permission = await this.findById(id);
    if (!permission) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }
    
    // Update permission properties
    Object.assign(permission, updateData);
    
    return this.permissionRepository.save(permission);
  }

  /**
   * Delete a permission
   * @param id Permission ID
   * @returns True if successful
   */
  async delete(id: string): Promise<boolean> {
    const permission = await this.findById(id);
    if (!permission) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }
    
    await this.permissionRepository.remove(permission);
    return true;
  }

  /**
   * Create default permissions for a tenant
   * @param tenantId Tenant ID
   */
  async createDefaultPermissions(tenantId: string): Promise<Permission[]> {
    // Set tenant context
    this.tenantContextService.setContext({
      tenantId,
      schema: `tenant_${tenantId}`,
    });
    
    // Default permissions
    const defaultPermissions = [
      { name: 'users:read', resource: 'users', action: 'read' },
      { name: 'users:create', resource: 'users', action: 'create' },
      { name: 'users:update', resource: 'users', action: 'update' },
      { name: 'users:delete', resource: 'users', action: 'delete' },
    ];
    
    const createdPermissions: Permission[] = [];
    
    // Create each permission
    for (const permData of defaultPermissions) {
      const existingPerm = await this.findByName(permData.name);
      if (!existingPerm) {
        const permission = await this.create({
          ...permData,
          tenantId,
        });
        createdPermissions.push(permission);
      } else {
        createdPermissions.push(existingPerm);
      }
    }
    
    return createdPermissions;
  }
}