import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToMany } from 'typeorm';
import { Role } from './role.entity';
import { BaseEntity } from '../../../common/entities/base.entity';

/**
 * Permission entity for granular access control
 * Used to define specific actions that can be performed
 */
@Entity({ name: 'permissions' })
export class Permission extends BaseEntity {
  @Column({ unique: true })
  name!: string;

  @Column({ nullable: true })
  description?: string;

  @Column()
  resource!: string;

  @Column()
  action!: string;

  @Column({ default: false })
  isGlobal!: boolean;

  @Column({ nullable: true })
  tenantId?: string;

  @ManyToMany(() => Role, role => role.permissions)
  roles!: Role[];
}