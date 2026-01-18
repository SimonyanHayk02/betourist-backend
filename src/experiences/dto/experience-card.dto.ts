import { ApiProperty } from '@nestjs/swagger';
import { CategoryPublicDto } from './category-public.dto';

class CityMiniDto {
  @ApiProperty({ example: '83b33f58-3ffc-4a78-a294-529e022c4a03' })
  id!: string;

  @ApiProperty({ example: 'Yerevan' })
  name!: string;
}

export class ExperienceCardDto {
  @ApiProperty({ example: '0a59b25a-62d9-48d5-a63e-6d322d9e89d3' })
  id!: string;

  @ApiProperty({ example: 'Sunset Wine Tour' })
  title!: string;

  @ApiProperty({ nullable: true, example: 'Great for couples. Includes tasting.' })
  shortDescription!: string | null;

  @ApiProperty({ example: true })
  featured!: boolean;

  @ApiProperty({ nullable: true, example: 'https://res.cloudinary.com/.../hero.jpg' })
  heroImageUrl!: string | null;

  @ApiProperty({ nullable: true, example: 2500, description: 'Minimum/starting price (cents).' })
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
}


