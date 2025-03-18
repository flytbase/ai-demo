import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, ManyToMany, JoinTable, OneToMany } from 'typeorm';
import { Tenant } from '../../tenant/entities/tenant.entity';
import { Role } from '../../auth/entities/role.entity';
import { RefreshToken } from '../../auth/entities/refresh-token.entity';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Exclude } from 'class-transformer';

/**
 * User entity containing account and profile information
 */
@Entity({ name: 'users' })
export class User extends BaseEntity {
  @Column()
  firstName!: string;

  @Column()
  lastName!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  @Exclude({ toPlainOnly: true }) // Exclude password from responses
  password!: string;

  @Column({ nullable: true })
  roleId?: string;

  @Column({ nullable: true })
  tenantId?: string;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ nullable: true })
  lastLoginAt?: Date;

  @Column({ default: false })
  isEmailVerified!: boolean;

  @Column({ nullable: true })
  emailVerificationToken?: string;

  @Column({ nullable: true })
  passwordResetToken?: string;

  @Column({ nullable: true })
  passwordResetExpires?: Date;

  @ManyToOne(() => Tenant, tenant => tenant.users)
  @JoinColumn({ name: 'tenantId' })
  tenant?: Tenant;

  @ManyToOne(() => Role, role => role.users)
  @JoinColumn({ name: 'roleId' })
  role?: Role;

  @OneToMany(() => RefreshToken, refreshToken => refreshToken.user)
  refreshTokens?: RefreshToken[];

  /**
   * Get full name by combining first and last name
   */
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}