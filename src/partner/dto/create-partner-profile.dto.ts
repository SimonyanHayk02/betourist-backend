import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreatePartnerProfileDto {
  @ApiProperty({ example: 'Awesome Tours LLC' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;
}


