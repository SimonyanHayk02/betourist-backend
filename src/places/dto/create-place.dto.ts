import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreatePlaceDto {
  @ApiProperty({ example: 'Coffee House' })
  @IsString({ message: 'name must be a string' })
  @MaxLength(200, { message: 'name must be at most 200 characters' })
  name!: string;

  @ApiPropertyOptional({ example: 'Great coffee and desserts.' })
  @IsOptional()
  @IsString({ message: 'description must be a string' })
  @MaxLength(5000, { message: 'description must be at most 5000 characters' })
  description?: string;

  @ApiProperty({ example: 'bf291080-71c3-4615-8fdd-06d31ca5ef85' })
  @IsUUID('4', { message: 'cityId must be a UUID' })
  cityId!: string;

  @ApiPropertyOptional({ example: '7f3c2f2c-1111-4444-8888-123456789abc' })
  @IsOptional()
  @IsUUID('4', { message: 'categoryId must be a UUID' })
  categoryId?: string;

  @ApiPropertyOptional({
    example: ['https://cdn.example.com/places/1.jpg'],
    description: 'Optional media URLs to attach to the place',
  })
  @IsOptional()
  @IsArray({ message: 'mediaUrls must be an array' })
  @IsUrl({}, { each: true, message: 'each mediaUrls item must be a valid URL' })
  mediaUrls?: string[];
}
