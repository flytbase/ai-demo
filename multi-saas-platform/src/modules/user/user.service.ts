import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { TenantContextService } from '../tenant/tenant-context.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly tenantContextService: TenantContextService,
  ) {}

  /**
   * Find a user by email within the current tenant context
   * @param email User's email address
   * @returns User entity or undefined
   */
  async findByEmail(email: string): Promise<User | undefined> {
    const tenantId = this.tenantContextService.getCurrentTenantId();
    const query = this.userRepository.createQueryBuilder('user')
      .where('user.email = :email', { email });
    
    // Apply tenant filter if in tenant context
    if (tenantId && tenantId !== 'public') {
      query.andWhere('user.tenantId = :tenantId', { tenantId });
    }
    
    const user = await query.getOne();
    return user || undefined;
  }

  /**
   * Find a user by ID within the current tenant context
   * @param id User ID
   * @returns User entity or undefined
   */
  async findById(id: number): Promise<User | undefined> {
    const tenantId = this.tenantContextService.getCurrentTenantId();
    const query = this.userRepository.createQueryBuilder('user')
      .where('user.id = :id', { id });
    
    // Apply tenant filter if in tenant context
    if (tenantId && tenantId !== 'public') {
      query.andWhere('user.tenantId = :tenantId', { tenantId });
    }
    
    const user = await query.getOne();
    return user || undefined;
  }

  /**
   * Create a new user in the current tenant context
   * @param createUserDto User creation data
   * @returns Created user
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    // Get current tenant context
    const tenantId = this.tenantContextService.getCurrentTenantId();
    
    // Hash password before saving
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(createUserDto.password, salt);
    
    // Create user with tenant ID
    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
      tenantId: tenantId !== 'public' ? tenantId : undefined,
    });
    
    return this.userRepository.save(user);
  }

  /**
   * Find all users in the current tenant context
   * @returns Array of users
   */
  async findAll(): Promise<User[]> {
    const tenantId = this.tenantContextService.getCurrentTenantId();
    const query = this.userRepository.createQueryBuilder('user');
    
    // Apply tenant filter if in tenant context
    if (tenantId && tenantId !== 'public') {
      query.where('user.tenantId = :tenantId', { tenantId });
    }
    
    return query.getMany();
  }

  /**
   * Update a user in the current tenant context
   * @param id User ID
   * @param updateData Partial user data to update
   * @returns Updated user
   */
  async update(id: number, updateData: Partial<User>): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    
    // Hash password if provided
    if (updateData.password) {
      const salt = await bcrypt.genSalt();
      updateData.password = await bcrypt.hash(updateData.password, salt);
    }
    
    // Update user properties
    Object.assign(user, updateData);
    
    return this.userRepository.save(user);
  }

  /**
   * Delete a user in the current tenant context
   * @param id User ID
   * @returns True if successful
   */
  async delete(id: number): Promise<boolean> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    
    await this.userRepository.remove(user);
    return true;
  }
}