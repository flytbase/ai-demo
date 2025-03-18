import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiVersion, DEFAULT_VERSION } from './api-versioning.config';
import { ApiVersionInfoDto } from '../dto/api-response.dto';
import { Public } from '../../common/guards/tenant.guard';

@ApiTags('version')
@Controller('version')
export class VersionController {
  @Public()
  @Get()
  @ApiOperation({ summary: 'Get API version information' })
  @ApiResponse({
    status: 200,
    description: 'Version information retrieved successfully',
    type: ApiVersionInfoDto,
  })
  getVersionInfo(): ApiVersionInfoDto {
    return {
      version: `${DEFAULT_VERSION.version}.0.0`,
      timestamp: new Date().toISOString(),
      available: {
        v1: { status: 'stable', latest: true },
        v2: { status: 'beta', latest: false },
      },
    };
  }
}