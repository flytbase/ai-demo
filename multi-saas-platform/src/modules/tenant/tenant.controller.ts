import { Controller, Get, Post, Body, Param, NotFoundException } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { Tenant } from './entities/tenant.entity';

@Controller('tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Post()
  async create(@Body() createTenantDto: CreateTenantDto): Promise<Tenant> {
    return this.tenantService.create(createTenantDto);
  }

  @Get()
  async findAll(): Promise<Tenant[]> {
    return this.tenantService.getAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Tenant> {
    const tenant = await this.tenantService.findById(id);
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }
    return tenant;
  }
}