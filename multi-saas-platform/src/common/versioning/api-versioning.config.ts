import { VersioningType } from '@nestjs/common';

export enum ApiVersion {
  V1 = '1',
  V2 = '2',
}

export const API_VERSION_HEADER = 'X-API-Version';

export interface ApiVersionOptions {
  version: string;
  isDefault?: boolean;
  summary?: string;
}

export const DEFAULT_VERSION: ApiVersionOptions = {
  version: ApiVersion.V1,
  isDefault: true,
};

export const VERSIONING_CONFIG = {
  type: VersioningType.URI,
  defaultVersion: DEFAULT_VERSION.version,
  prefix: 'api/v',
};

export function getVersionTag(version: string): string {
  return `v${version}`;
}