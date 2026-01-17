import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, Matches } from 'class-validator';

export class UpdateCategoryDto {
  @ApiPropertyOptional({ example: 'Cafe' })
  @IsOptional()
  @IsString({ message: 'name must be a string' })
  @MaxLength(100, { message: 'name must be at most 100 characters' })
  name?: string;

  @ApiPropertyOptional({ example: 'cafe', description: 'URL-safe slug' })
  @IsOptional()
  @IsString({ message: 'slug must be a string' })
  @MaxLength(100, { message: 'slug must be at most 100 characters' })
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug must be lowercase kebab-case (e.g. "coffee-shop")',
  })
  slug?: string;
}


