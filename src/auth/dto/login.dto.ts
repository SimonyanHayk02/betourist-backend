import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class LoginDto {
  @ValidateIf((o: LoginDto) => !o.phone)
  @IsEmail({}, { message: 'email must be a valid email address' })
  @MaxLength(320, { message: 'email must be at most 320 characters' })
  email?: string;

  @ValidateIf((o: LoginDto) => !o.email)
  @IsString({ message: 'phone must be a string' })
  @Matches(/^\+?[1-9]\d{7,14}$/, {
    message: 'phone must be a valid E.164 number (e.g. +374XXXXXXXX)',
  })
  phone?: string;

  @IsString({ message: 'password must be a string' })
  password!: string;
}


