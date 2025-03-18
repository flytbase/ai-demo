import { ApiProperty } from '@nestjs/swagger';

export class ApiErrorDto {
  @ApiProperty({ example: 400 })
  statusCode!: number;

  @ApiProperty({ example: 'Bad Request' })
  error!: string;

  @ApiProperty({ example: 'Validation failed' })
  message!: string;

  @ApiProperty({ example: '2025-03-18T12:00:00.000Z' })
  timestamp!: string;

  @ApiProperty({ example: '/api/v1/resource' })
  path!: string;

  constructor(partial?: Partial<ApiErrorDto>) {
    Object.assign(this, partial);
  }
}

export class ApiPaginatedResponseDto<T> {
  @ApiProperty({ example: [{}], description: 'Array of items' })
  data!: T[];

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 10 })
  limit!: number;

  @ApiProperty({ example: 100 })
  total!: number;

  @ApiProperty({ example: 10 })
  totalPages!: number;

  @ApiProperty({ example: true })
  hasNext!: boolean;

  @ApiProperty({ example: false })
  hasPrevious!: boolean;

  constructor(partial?: Partial<ApiPaginatedResponseDto<T>>) {
    Object.assign(this, partial);
  }
}

export class ApiResponseDto<T> {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: {} })
  data!: T;

  @ApiProperty({ example: 'Operation completed successfully' })
  message?: string;

  constructor(partial?: Partial<ApiResponseDto<T>>) {
    Object.assign(this, partial);
  }
}

export class ApiVersionInfoDto {
  @ApiProperty({ example: '1.0.0' })
  version!: string;

  @ApiProperty({ example: '2025-03-18T12:00:00.000Z' })
  timestamp!: string;

  @ApiProperty({
    example: {
      v1: { status: 'stable', latest: true },
      v2: { status: 'beta', latest: false }
    }
  })
  available!: Record<string, { status: string; latest: boolean }>;

  constructor(partial?: Partial<ApiVersionInfoDto>) {
    Object.assign(this, partial);
  }
}