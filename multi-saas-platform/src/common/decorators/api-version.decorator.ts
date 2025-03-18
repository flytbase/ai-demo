import { applyDecorators, Version } from '@nestjs/common';
import { ApiVersionOptions, getVersionTag } from '../versioning/api-versioning.config';
import { ApiOperation } from '@nestjs/swagger';

/**
 * Applies version to a controller or route handler
 * @param options API version options
 */
export function ApiVersion(options: ApiVersionOptions) {
  const { version, isDefault, summary } = options;
  
  // We only apply the version decorator if it's not the default version
  // as the default version is already applied globally
  if (!isDefault) {
    const versionTag = getVersionTag(version);
    return applyDecorators(
      Version(version),
      ApiOperation({ summary: `[${versionTag}] ${summary || ''}` })
    );
  }
  
  return applyDecorators();
}

/**
 * Applies deprecated marker to a controller or route handler
 * @param version The version that's deprecated
 * @param message Optional message for the deprecation
 */
export function ApiDeprecated(version: string, message?: string) {
  const deprecationMessage = message 
    ? `[DEPRECATED in v${version}] ${message}`
    : `[DEPRECATED in v${version}]`;
  
  return applyDecorators(
    ApiOperation({ 
      summary: deprecationMessage,
      deprecated: true 
    })
  );
}