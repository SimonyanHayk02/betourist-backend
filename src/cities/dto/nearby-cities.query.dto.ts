import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber, Max, Min } from 'class-validator';

export class NearbyCitiesQueryDto {
  @ApiProperty({ example: 40.1772, description: 'Latitude' })
  @IsNumber({}, { message: 'lat must be a number' })
  @Min(-90, { message: 'lat must be >= -90' })
  @Max(90, { message: 'lat must be <= 90' })
  lat!: number;

  @ApiProperty({ example: 44.5126, description: 'Longitude' })
  @IsNumber({}, { message: 'lng must be a number' })
  @Min(-180, { message: 'lng must be >= -180' })
  @Max(180, { message: 'lng must be <= 180' })
  lng!: number;

  @ApiProperty({ example: 5000, description: 'Search radius in meters' })
  @IsInt({ message: 'radiusMeters must be an integer' })
  @Min(1, { message: 'radiusMeters must be >= 1' })
  @Max(50000, { message: 'radiusMeters must be <= 50000' })
  radiusMeters!: number;

  @ApiProperty({ example: 50, required: false, description: 'Max results' })
  @IsInt({ message: 'limit must be an integer' })
  @Min(1, { message: 'limit must be >= 1' })
  @Max(200, { message: 'limit must be <= 200' })
  limit: number = 50;
}
