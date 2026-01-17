import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiPropertyOptional({
    example: 'test@example.com',
    description: 'Required if phone is not provided.',
  })
  @ValidateIf((o: LoginDto) => !o.phone)
  @IsEmail({}, { message: 'email must be a valid email address' })
  @MaxLength(320, { message: 'email must be at most 320 characters' })
  email?: string;

  @ApiPropertyOptional({
    example: '+37499123456',
    description: 'E.164 phone number. Required if email is not provided.',
  })
  @ValidateIf((o: LoginDto) => !o.email)
  @IsString({ message: 'phone must be a string' })
  @Matches(/^\+?[1-9]\d{7,14}$/, {
    message: 'phone must be a valid E.164 number (e.g. +374XXXXXXXX)',
  })
  phone?: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString({ message: 'password must be a string' })
  password!: string;
}


