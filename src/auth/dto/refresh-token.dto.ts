import { IsJWT } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIuLi4iLCJyb2xlIjoidG91cmlzdCIsImlhdCI6MTc2ODY1NjAxNSwiZXhwIjoxNzcxMjQ4MDE1fQ.XXXXXXXXXXXXXXXXXXXX',
  })
  @IsJWT({ message: 'refreshToken must be a valid JWT' })
  refreshToken!: string;
}


