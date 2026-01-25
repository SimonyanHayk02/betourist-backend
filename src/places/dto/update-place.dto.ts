import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class UpdatePlaceDto {
  @ApiPropertyOptional({ example: 'Coffee House' })
  @IsOptional()
  @IsString({ message: 'name must be a string' })
  @MaxLength(200, { message: 'name must be at most 200 characters' })
  name?: string;

  @ApiPropertyOptional({ example: 'Updated description (or null to clear)' })
  @IsOptional()
  @ValidateIf((o: UpdatePlaceDto) => o.description !== undefined)
  @MaxLength(5000, { message: 'description must be at most 5000 characters' })
  description?: string | null;

  @ApiPropertyOptional({
    example: '7f3c2f2c-1111-4444-8888-123456789abc',
    nullable: true,
    description: 'Set to a UUID to assign category, or null to remove category',
  })
  @IsOptional()
  @ValidateIf(
    (o: UpdatePlaceDto) => o.categoryId !== null && o.categoryId !== undefined,
  )
  @IsUUID('4', { message: 'categoryId must be a UUID' })
  categoryId?: string | null;

  @ApiPropertyOptional({
    example: [
      'https://cdn.example.com/places/1.jpg',
      'https://cdn.example.com/places/2.jpg',
    ],
    description:
      'If provided, replaces all media for the place and sets sortOrder by array index. Can be empty [] to clear.',
  })
  @IsOptional()
  @IsArray({ message: 'mediaUrls must be an array' })
  @IsUrl({}, { each: true, message: 'each mediaUrls item must be a valid URL' })
  mediaUrls?: string[];
}
