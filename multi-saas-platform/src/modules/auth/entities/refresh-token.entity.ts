import { Entity, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { BaseEntity } from '../../../common/entities/base.entity';

/**
 * RefreshToken entity for managing JWT refresh tokens
 * Supports token rotation, revocation, and expiration
 */
@Entity({ name: 'refresh_tokens' })
export class RefreshToken extends BaseEntity {
  @Column({ type: 'text' })
  token!: string;

  @Column({ type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ default: false })
  isRevoked!: boolean;

  @Column({ default: '' })
  ipAddress!: string;

  @Column({ default: '' })
  userAgent!: string;

  @Column()
  @Index()
  userId!: number;

  @Column({ nullable: true })
  @Index()
  tenantId?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  /**
   * Check if the token is expired
   */
  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  /**
   * Check if the token is valid (not expired and not revoked)
   */
  isValid(): boolean {
    return !this.isExpired() && !this.isRevoked;
  }
}