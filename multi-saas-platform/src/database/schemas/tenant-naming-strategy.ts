import { DefaultNamingStrategy, NamingStrategyInterface } from 'typeorm';
import { snakeCase } from 'typeorm/util/StringUtils';
import { TenantContextService } from '../../modules/tenant/tenant-context.service';

/**
 * Custom naming strategy for multi-tenant schemas
 * Prefixes table names with the current tenant schema
 */
export class TenantNamingStrategy extends DefaultNamingStrategy implements NamingStrategyInterface {
  constructor(private readonly tenantContextService: TenantContextService) {
    super();
  }

  /**
   * Returns table name with schema prefix based on the current tenant context
   */
  tableName(targetName: string, userSpecifiedName: string | undefined): string {
    const name = userSpecifiedName || snakeCase(targetName);
    const schema = this.tenantContextService.getCurrentSchema();
    return `${schema}.${name}`;
  }

  /**
   * Returns column name in snake_case
   */
  columnName(
    propertyName: string,
    customName: string | undefined,
    embeddedPrefixes: string[],
  ): string {
    return snakeCase(embeddedPrefixes.concat(customName || propertyName).join('_'));
  }

  /**
   * Returns index name prefixed with schema
   */
  indexName(tableOrName: string, columnNames: string[], where?: string): string {
    const schema = this.tenantContextService.getCurrentSchema();
    const tableName = tableOrName.replace(`${schema}.`, '');
    const name = super.indexName(tableName, columnNames, where);
    return name;
  }

  /**
   * Returns foreign key constraint name prefixed with schema
   */
  foreignKeyName(tableOrName: string, columnNames: string[], referencedTablePath?: string, referencedColumnNames?: string[]): string {
    const schema = this.tenantContextService.getCurrentSchema();
    const tableName = tableOrName.replace(`${schema}.`, '');
    let referencedTableName = referencedTablePath;
    if (referencedTableName && referencedTableName.includes('.')) {
      referencedTableName = referencedTableName.split('.')[1];
    }
    return super.foreignKeyName(tableName, columnNames, referencedTableName, referencedColumnNames);
  }
}