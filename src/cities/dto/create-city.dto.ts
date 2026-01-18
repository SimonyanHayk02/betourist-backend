import { IsOptional, IsString, IsUUID, IsUrl, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsWktPoint } from '../../common/validators/wkt-point.validator';

export class CreateCityDto {
  @ApiProperty({ example: 'Yerevan' })
  @IsString({ message: 'name must be a string' })
  @MaxLength(200, { message: 'name must be at most 200 characters' })
  name!: string;

  @ApiProperty({ example: '5d7aebdb-fd4d-4be4-926a-724a622db999' })
  @IsUUID('4', { message: 'countryId must be a UUID' })
  countryId!: string;

  @IsOptional()
  @ApiPropertyOptional({
    example: 'POINT(44.5126 40.1772)',
    description: 'WKT POINT in lon/lat order (SRID 4326).',
  })
  @IsString({ message: 'wktLocation must be a string' })
  @IsWktPoint({
    message:
      'wktLocation must be WKT POINT(lon lat) with lon in [-180,180] and lat in [-90,90]',
  })
  // Example: "POINT(44.5126 40.1772)" (lon lat)
  wktLocation?: string;

  @IsOptional()
  @ApiPropertyOptional({
    example:
      'https://res.cloudinary.com/dmnpoykc6/image/upload/f_auto,q_auto,w_1600/v1/cities/yerevan.jpg',
    description: 'Public URL for the city header/hero image (e.g. Cloudinary secure_url).',
  })
  @IsUrl({}, { message: 'heroImageUrl must be a valid URL' })
  heroImageUrl?: string;
}


