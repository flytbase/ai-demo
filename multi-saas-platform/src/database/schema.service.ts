import { Injectable, Inject } from '@nestjs/common';
import { Connection } from 'typeorm';
import { TYPEORM_CONNECTION } from '@nestjs/typeorm/dist/typeorm.constants';

/**
 * Service for managing database schemas for multi-tenant application
 */
@Injectable()
export class SchemaService {
  constructor(
    @Inject(TYPEORM_CONNECTION) private readonly connection: Connection,
  ) {}

  /**
   * Create a new schema for a tenant
   * @param schema Schema name to create
   * @returns True if schema was created, false if it already exists
   */
  async createSchema(schema: string): Promise<boolean> {
    try {
      // Check if schema exists
      const schemaExists = await this.schemaExists(schema);
      
      if (!schemaExists) {
        // Create schema if it doesn't exist
        await this.connection.query(`CREATE SCHEMA IF NOT EXISTS ${schema}`);
        console.log(`Created schema: ${schema}`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`Failed to create schema ${schema}:`, error);
      throw new Error(`Failed to create schema ${schema}: ${error.message}`);
    }
  }

  /**
   * Drop a schema and all its objects
   * @param schema Schema name to drop
   * @param cascade Whether to cascade the drop operation
   * @returns True if schema was dropped, false if it doesn't exist
   */
  async dropSchema(schema: string, cascade = false): Promise<boolean> {
    try {
      // Check if schema exists
      const schemaExists = await this.schemaExists(schema);
      
      if (schemaExists) {
        // Drop schema if it exists
        await this.connection.query(`DROP SCHEMA ${schema} ${cascade ? 'CASCADE' : ''}`);
        console.log(`Dropped schema: ${schema}`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`Failed to drop schema ${schema}:`, error);
      throw new Error(`Failed to drop schema ${schema}: ${error.message}`);
    }
  }

  /**
   * Check if a schema exists in the database
   * @param schema Schema name to check
   * @returns True if schema exists, false otherwise
   */
  async schemaExists(schema: string): Promise<boolean> {
    try {
      const result = await this.connection.query(
        `SELECT EXISTS(SELECT 1 FROM information_schema.schemata WHERE schema_name = $1)`,
        [schema]
      );
      
      return result[0].exists;
    } catch (error) {
      console.error(`Failed to check if schema ${schema} exists:`, error);
      throw new Error(`Failed to check if schema ${schema} exists: ${error.message}`);
    }
  }

  /**
   * List all schemas in the database
   * @returns Array of schema names
   */
  async listSchemas(): Promise<string[]> {
    try {
      const result = await this.connection.query(
        `SELECT schema_name FROM information_schema.schemata 
         WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')`
      );
      
      return result.map(row => row.schema_name);
    } catch (error) {
      console.error('Failed to list schemas:', error);
      throw new Error(`Failed to list schemas: ${error.message}`);
    }
  }

  /**
   * Create a new role for a tenant with limited permissions
   * @param roleName Role name to create (usually tenant ID)
   * @param schema Schema name to grant permissions on
   * @returns True if role was created, false if it already exists
   */
  async createTenantRole(roleName: string, schema: string): Promise<boolean> {
    try {
      // Check if role exists
      const roleExists = await this.roleExists(roleName);
      
      if (!roleExists) {
        // Create role if it doesn't exist
        await this.connection.query(`CREATE ROLE ${roleName}`);
        
        // Grant usage on schema
        await this.connection.query(`GRANT USAGE ON SCHEMA ${schema} TO ${roleName}`);
        
        // Grant select, insert, update, delete on all tables in schema
        await this.connection.query(
          `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA ${schema} TO ${roleName}`
        );
        
        // Grant usage on all sequences in schema
        await this.connection.query(
          `GRANT USAGE ON ALL SEQUENCES IN SCHEMA ${schema} TO ${roleName}`
        );
        
        console.log(`Created role ${roleName} for schema ${schema}`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`Failed to create role ${roleName}:`, error);
      throw new Error(`Failed to create role ${roleName}: ${error.message}`);
    }
  }

  /**
   * Check if a role exists in the database
   * @param roleName Role name to check
   * @returns True if role exists, false otherwise
   */
  async roleExists(roleName: string): Promise<boolean> {
    try {
      const result = await this.connection.query(
        `SELECT EXISTS(SELECT 1 FROM pg_roles WHERE rolname = $1)`,
        [roleName]
      );
      
      return result[0].exists;
    } catch (error) {
      console.error(`Failed to check if role ${roleName} exists:`, error);
      throw new Error(`Failed to check if role ${roleName} exists: ${error.message}`);
    }
  }
}