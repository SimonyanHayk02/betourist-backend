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
  @IsEmail()
  @MaxLength(320)
  email?: string;

  @ValidateIf((o: RegisterDto) => !o.email)
  @IsString()
  @Matches(/^\+?[1-9]\d{7,14}$/, {
    message: 'phone must be a valid E.164 number (e.g. +374XXXXXXXX)',
  })
  phone?: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;
}


