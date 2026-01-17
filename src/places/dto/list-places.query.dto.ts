import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBooleanString, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class ListPlacesQueryDto {
  @ApiPropertyOptional({ example: 1, description: 'Page number (1-based)' })
  @IsInt({ message: 'page must be an integer' })
  @Min(1, { message: 'page must be >= 1' })
  page: number = 1;

  @ApiPropertyOptional({ example: 20, description: 'Items per page' })
  @IsInt({ message: 'limit must be an integer' })
  @Min(1, { message: 'limit must be >= 1' })
  @Max(100, { message: 'limit must be <= 100' })
  limit: number = 20;

  @ApiPropertyOptional({ example: '5d7aebdb-fd4d-4be4-926a-724a622db999' })
  @IsOptional()
  @IsUUID('4', { message: 'cityId must be a UUID' })
  cityId?: string;

  @ApiPropertyOptional({ example: 'e7aebdb-fd4d-4be4-926a-724a622db111' })
  @IsOptional()
  @IsUUID('4', { message: 'categoryId must be a UUID' })
  categoryId?: string;

  @ApiPropertyOptional({ example: 'coffee', description: 'Search by name (contains, case-insensitive)' })
  @IsOptional()
  @IsString({ message: 'q must be a string' })
  q?: string;

  @ApiPropertyOptional({
    example: 'false',
    description:
      'If true, include unpublished places (admin-only in later steps). Currently ignored unless true is provided explicitly.',
  })
  @IsOptional()
  @IsBooleanString({ message: 'includeUnpublished must be a boolean string (true/false)' })
  includeUnpublished?: string;
}


