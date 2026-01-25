import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiPropertyOptional({
    example: 'test@example.com',
    description: 'Required if phone is not provided.',
  })
  @ValidateIf((o: RegisterDto) => !o.phone)
  @IsEmail({}, { message: 'email must be a valid email address' })
  @MaxLength(320, { message: 'email must be at most 320 characters' })
  email?: string;

  @ApiPropertyOptional({
    example: '+37499123456',
    description: 'E.164 phone number. Required if email is not provided.',
  })
  @ValidateIf((o: RegisterDto) => !o.email)
  @IsString({ message: 'phone must be a string' })
  @Matches(/^\+?[1-9]\d{7,14}$/, {
    message: 'phone must be a valid E.164 number (e.g. +374XXXXXXXX)',
  })
  phone?: string;

  @ApiProperty({
    example: 'Password123!',
    description:
      'At least 8 chars, must include lowercase, uppercase and a number.',
  })
  @IsString({ message: 'password must be a string' })
  @MinLength(8, { message: 'password must be at least 8 characters' })
  @MaxLength(72, { message: 'password must be at most 72 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message:
      'password must contain at least 1 lowercase letter, 1 uppercase letter, and 1 number',
  })
  password!: string;
}
