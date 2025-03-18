import { CreateDateColumn, UpdateDateColumn, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Base entity class with common fields
 * All tenant-specific entities should extend this class
 */
export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;
}

/**
 * Base entity class with tenant ID field
 * Used for entities that need to be explicitly associated with a tenant
 * This is an alternative to schema-based isolation
 */
export abstract class TenantBaseEntity extends BaseEntity {
  // This field is used for explicit tenant association
  // Useful for cross-tenant operations or when using a shared schema
  tenantId!: string;
}