import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './entities/tenant.entity';
import { SchemaService } from '../../database/schema.service';
import { CreateTenantDto } from './dto/create-tenant.dto';

@Injectable()
export class TenantService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    private readonly schemaService: SchemaService,
  ) {}

  /**
   * Find a tenant by ID
   * @param id Tenant ID
   * @returns Tenant entity or undefined
   */
  async findById(id: string): Promise<Tenant | undefined> {
    const tenant = await this.tenantRepository.findOne({ where: { id } });
    return tenant || undefined;
  }

  /**
   * Find a tenant by domain
   * @param domain Tenant domain
   * @returns Tenant entity or undefined
   */
  async findByDomain(domain: string): Promise<Tenant | undefined> {
    const tenant = await this.tenantRepository.findOne({ where: { domain } });
    return tenant || undefined;
  }

  /**
   * Create a new tenant with schema
   * @param createTenantDto Tenant creation data
   * @returns Created tenant
   */
  async create(createTenantDto: CreateTenantDto): Promise<Tenant> {
    const tenant = this.tenantRepository.create({
      ...createTenantDto,
      schema: `tenant_${createTenantDto.domain.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`,
    });
    
    // Save tenant record
    const savedTenant = await this.tenantRepository.save(tenant);
    
    // Create schema for new tenant
    await this.schemaService.createSchema(savedTenant.schema!);
    
    // Optionally create role with permissions on schema
    await this.schemaService.createTenantRole(`tenant_${savedTenant.id}`, savedTenant.schema!);
    
    return savedTenant;
  }

  /**
   * Update a tenant
   * @param id Tenant ID
   * @param updateData Partial tenant data to update
   * @returns Updated tenant
   */
  async update(id: string, updateData: Partial<Tenant>): Promise<Tenant> {
    const tenant = await this.findById(id);
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }
    
    // Update tenant properties
    Object.assign(tenant, updateData);
    
    // If schema is being changed, create new schema
    if (updateData.schema && updateData.schema !== tenant.schema) {
      await this.schemaService.createSchema(updateData.schema);
    }
    
    return this.tenantRepository.save(tenant);
  }

  /**
   * Delete a tenant and optionally its schema
   * @param id Tenant ID
   * @param dropSchema Whether to drop the tenant's schema
   * @returns True if successful
   */
  async delete(id: string, dropSchema = false): Promise<boolean> {
    const tenant = await this.findById(id);
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }
    
    // Delete tenant record
    await this.tenantRepository.remove(tenant);
    
    // Optionally drop schema
    if (dropSchema && tenant.schema) {
      await this.schemaService.dropSchema(tenant.schema, true);
    }
    
    return true;
  }

  /**
   * Find all tenants
   * @returns Array of all tenants
   */
  async findAll(): Promise<Tenant[]> {
    return this.tenantRepository.find();
  }
}