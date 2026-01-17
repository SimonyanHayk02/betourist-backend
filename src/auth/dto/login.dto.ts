import { IsEmail, IsString, MaxLength, ValidateIf, Matches } from 'class-validator';

export class LoginDto {
  @ValidateIf((o: LoginDto) => !o.phone)
  @IsEmail()
  @MaxLength(320)
  email?: string;

  @ValidateIf((o: LoginDto) => !o.email)
  @IsString()
  @Matches(/^\+?[1-9]\d{7,14}$/, {
    message: 'phone must be a valid E.164 number (e.g. +374XXXXXXXX)',
  })
  phone?: string;

  @IsString()
  password!: string;
}


