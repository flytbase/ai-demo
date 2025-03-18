import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateTenantDto {
  @IsString()
  @IsNotEmpty()
  name = '';

  @IsString()
  @IsNotEmpty()
  domain = '';

  @IsString()
  @IsOptional()
  schema?: string;
}