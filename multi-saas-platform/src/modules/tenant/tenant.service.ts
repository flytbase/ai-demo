import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './entities/tenant.entity';

@Injectable()
export class TenantService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
  ) {}

  async findById(id: string): Promise<Tenant | undefined> {
    const tenant = await this.tenantRepository.findOne({ where: { id } });
    return tenant || undefined;
  }

  async findByDomain(domain: string): Promise<Tenant | undefined> {
    const tenant = await this.tenantRepository.findOne({ where: { domain } });
    return tenant || undefined;
  }

  async create(tenantData: Partial<Tenant>): Promise<Tenant> {
    const tenant = this.tenantRepository.create(tenantData);
    return this.tenantRepository.save(tenant);
  }

  async getAll(): Promise<Tenant[]> {
    return this.tenantRepository.find();
  }
}