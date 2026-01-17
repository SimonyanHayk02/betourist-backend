import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class RegisterDto {
  @ValidateIf((o: RegisterDto) => !o.phone)
  @IsEmail({}, { message: 'email must be a valid email address' })
  @MaxLength(320, { message: 'email must be at most 320 characters' })
  email?: string;

  @ValidateIf((o: RegisterDto) => !o.email)
  @IsString({ message: 'phone must be a string' })
  @Matches(/^\+?[1-9]\d{7,14}$/, {
    message: 'phone must be a valid E.164 number (e.g. +374XXXXXXXX)',
  })
  phone?: string;

  @IsString({ message: 'password must be a string' })
  @MinLength(8, { message: 'password must be at least 8 characters' })
  @MaxLength(72, { message: 'password must be at most 72 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message:
      'password must contain at least 1 lowercase letter, 1 uppercase letter, and 1 number',
  })
  password!: string;
}


