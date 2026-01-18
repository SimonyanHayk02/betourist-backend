import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, Matches, Min } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Cafe' })
  @IsString({ message: 'name must be a string' })
  @MaxLength(100, { message: 'name must be at most 100 characters' })
  name!: string;

  @ApiProperty({ example: 'cafe', description: 'URL-safe slug' })
  @IsString({ message: 'slug must be a string' })
  @MaxLength(100, { message: 'slug must be at most 100 characters' })
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug must be lowercase kebab-case (e.g. "coffee-shop")',
  })
  slug!: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean({ message: 'isActive must be a boolean' })
  isActive?: boolean;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @Min(0, { message: 'order must be >= 0' })
  @IsInt({ message: 'order must be an integer' })
  order?: number;
}


