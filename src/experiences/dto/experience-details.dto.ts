import { ApiProperty } from '@nestjs/swagger';
import { CategoryPublicDto } from './category-public.dto';

class CityMiniDto {
  @ApiProperty({ example: '83b33f58-3ffc-4a78-a294-529e022c4a03' })
  id!: string;

  @ApiProperty({ example: 'Yerevan' })
  name!: string;
}

class GalleryItemDto {
  @ApiProperty({ example: 'https://res.cloudinary.com/.../img1.jpg' })
  url!: string;

  @ApiProperty({ example: 0 })
  sortOrder!: number;
}

class GeoDto {
  @ApiProperty({ nullable: true, example: 40.1772 })
  lat!: number | null;

  @ApiProperty({ nullable: true, example: 44.5126 })
  lng!: number | null;
}

export class ExperienceDetailsDto {
  @ApiProperty({ example: '0a59b25a-62d9-48d5-a63e-6d322d9e89d3' })
  id!: string;

  @ApiProperty({ example: 'Sunset Wine Tour' })
  title!: string;

  @ApiProperty({ nullable: true })
  description!: string | null;

  @ApiProperty({ example: true })
  featured!: boolean;

  @ApiProperty({ nullable: true })
  heroImageUrl!: string | null;

  @ApiProperty({ nullable: true, example: 2500 })
  priceFromCents!: number | null;

  @ApiProperty({ nullable: true, example: 'USD' })
  currency!: string | null;

  @ApiProperty({ example: 4.8 })
  ratingAvg!: number;

  @ApiProperty({ example: 120 })
  ratingCount!: number;

  @ApiProperty({ type: CategoryPublicDto, nullable: true })
  category!: CategoryPublicDto | null;

  @ApiProperty({ type: CityMiniDto })
  city!: CityMiniDto;

  @ApiProperty({ type: GeoDto })
  geo!: GeoDto;

  @ApiProperty({ type: [GalleryItemDto] })
  gallery!: GalleryItemDto[];
}


