import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  firstName = '';

  @IsString()
  @IsNotEmpty()
  lastName = '';

  @IsEmail()
  @IsNotEmpty()
  email = '';

  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  password = '';

  @IsString()
  @IsOptional()
  tenantId?: string;
}