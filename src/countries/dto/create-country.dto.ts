import { IsOptional, IsString, Length, MaxLength } from 'class-validator';

export class CreateCountryDto {
  @IsString({ message: 'name must be a string' })
  @MaxLength(150, { message: 'name must be at most 150 characters' })
  name!: string;

  @IsString({ message: 'isoCode2 must be a string' })
  @Length(2, 2, { message: 'isoCode2 must be exactly 2 characters' })
  isoCode2!: string;

  @IsOptional()
  @IsString({ message: 'isoCode3 must be a string' })
  @Length(3, 3, { message: 'isoCode3 must be exactly 3 characters' })
  isoCode3?: string;
}


