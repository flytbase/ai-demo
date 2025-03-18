import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantController } from './tenant.controller';
import { TenantService } from './tenant.service';
import { TenantContextModule } from './tenant-context.module';
import { Tenant } from './entities/tenant.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tenant]),
    TenantContextModule
  ],
  controllers: [TenantController],
  providers: [TenantService],
  exports: [TenantService],
})
export class TenantModule {}