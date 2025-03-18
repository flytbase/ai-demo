import { Command, CommandRunner } from 'nest-commander';
import { Injectable } from '@nestjs/common';
import { AuthSeeder } from '../modules/auth/seeders/auth.seeder';

/**
 * Command to seed the database with initial data
 * Usage: npm run seed
 */
@Injectable()
@Command({
  name: 'seed',
  description: 'Seed database with initial data',
})
export class SeedCommand extends CommandRunner {
  constructor(private readonly authSeeder: AuthSeeder) {
    super();
  }

  /**
   * Run the seed command
   */
  async run(): Promise<void> {
    try {
      console.log('Starting seed process...');
      
      // Seed global roles and permissions
      await this.authSeeder.seedGlobalRolesAndPermissions();
      
      // Seed admin user
      await this.authSeeder.seedAdminUser('admin@example.com', 'Admin123!');
      
      console.log('Seed completed successfully!');
      process.exit(0);
    } catch (error) {
      console.error('Error during seed process:', error);
      process.exit(1);
    }
  }
}