import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
  // Example: "POINT(44.5126 40.1772)" (lon lat)
  wktLocation?: string;
}


