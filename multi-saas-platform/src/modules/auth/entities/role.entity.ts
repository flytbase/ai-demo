import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable, OneToMany } from 'typeorm';
import { Permission } from './permission.entity';
import { User } from '../../user/entities/user.entity';
import { BaseEntity } from '../../../common/entities/base.entity';

/**
 * Role entity for RBAC
 * Manages access control based on user roles
 */
@Entity({ name: 'roles' })
export class Role extends BaseEntity {
  @Column()
  name!: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ default: false })
  isDefault!: boolean;

  @Column({ nullable: true })
  tenantId?: string;

  @Column({ default: false })
  isGlobal!: boolean;

  @Column({ nullable: true })
  parentId?: string;

  @ManyToMany(() => Permission)
  @JoinTable({
    name: 'role_permissions',
    joinColumn: { name: 'role_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'id' },
  })
  permissions!: Permission[];

  @OneToMany(() => User, user => user.role)
  users!: User[];
}