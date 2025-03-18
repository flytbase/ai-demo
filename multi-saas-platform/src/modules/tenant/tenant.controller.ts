import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  NotFoundException,
  Query,
  Version,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { TenantService } from './tenant.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { Tenant } from './entities/tenant.entity';
import { ApiVersion, ApiVersion as ApiVersionEnum } from '../../common/versioning/api-versioning.config';
import { ApiVersion as ApiVersionDecorator } from '../../common/decorators/api-version.decorator';

@ApiTags('tenants')
@Controller('tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new tenant' })
  @ApiResponse({ status: 201, description: 'Tenant successfully created', type: Tenant })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async create(@Body() createTenantDto: CreateTenantDto): Promise<Tenant> {
    return this.tenantService.create(createTenantDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tenants' })
  @ApiResponse({ status: 200, description: 'List of all tenants', type: [Tenant] })
  async findAll(): Promise<Tenant[]> {
    return this.tenantService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tenant by ID' })
  @ApiParam({ name: 'id', description: 'Tenant ID' })
  @ApiResponse({ status: 200, description: 'Tenant found', type: Tenant })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async findOne(@Param('id') id: string): Promise<Tenant> {
    const tenant = await this.tenantService.findById(id);
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }
    return tenant;
  }

  // Example of a V2 API endpoint with additional query parameters and functionality
  @Version(ApiVersionEnum.V2)
  @Get()
  @ApiVersionDecorator({ version: ApiVersionEnum.V2, summary: 'Get tenants with pagination and filtering' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (1-based)', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', type: Number })
  @ApiQuery({ name: 'search', required: false, description: 'Search term for tenant name', type: String })
  @ApiResponse({ status: 200, description: 'Paginated list of tenants', type: [Tenant] })
  async findAllV2(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search?: string,
  ): Promise<{ items: Tenant[]; total: number; page: number; limit: number }> {
    const items = await this.tenantService.findAll();
    // For demonstration purposes only. In a real implementation, 
    // we would implement proper pagination and filtering in the service
    let filtered = items;
    
    if (search) {
      filtered = items.filter(tenant => 
        tenant.name.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    return {
      items: filtered.slice((page - 1) * limit, page * limit),
      total: filtered.length,
      page,
      limit,
    };
  }
}