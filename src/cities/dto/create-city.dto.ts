import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateCityDto {
  @IsString({ message: 'name must be a string' })
  @MaxLength(200, { message: 'name must be at most 200 characters' })
  name!: string;

  @IsUUID('4', { message: 'countryId must be a UUID' })
  countryId!: string;

  @IsOptional()
  @IsString({ message: 'wktLocation must be a string' })
  // Example: "POINT(44.5126 40.1772)" (lon lat)
  wktLocation?: string;
}


