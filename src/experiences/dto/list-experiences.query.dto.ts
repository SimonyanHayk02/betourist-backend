import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBooleanString, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class ListExperiencesQueryDto {
  @ApiPropertyOptional({ description: 'Filter by city', example: '83b33f58-3ffc-4a78-a294-529e022c4a03' })
  @IsOptional()
  @IsUUID('4', { message: 'cityId must be a UUID' })
  cityId?: string;

  @ApiPropertyOptional({ description: 'Featured only (default true)', example: 'true' })
  @IsOptional()
  @IsBooleanString({ message: 'featured must be a boolean string' })
  featured?: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Min(1)
  @IsInt()
  page?: number;

  @ApiPropertyOptional({ example: 20, default: 20, maximum: 100 })
  @IsOptional()
  @Min(1)
  @Max(100)
  @IsInt()
  limit?: number;
}


