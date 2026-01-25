import { IsOptional, IsString, Length, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCountryDto {
  @ApiProperty({ example: 'Armenia' })
  @IsString({ message: 'name must be a string' })
  @MaxLength(150, { message: 'name must be at most 150 characters' })
  name!: string;

  @ApiProperty({ example: 'AM', description: 'ISO 3166-1 alpha-2' })
  @IsString({ message: 'isoCode2 must be a string' })
  @Length(2, 2, { message: 'isoCode2 must be exactly 2 characters' })
  isoCode2!: string;

  @IsOptional()
  @ApiPropertyOptional({ example: 'ARM', description: 'ISO 3166-1 alpha-3' })
  @IsString({ message: 'isoCode3 must be a string' })
  @Length(3, 3, { message: 'isoCode3 must be exactly 3 characters' })
  isoCode3?: string;
}
