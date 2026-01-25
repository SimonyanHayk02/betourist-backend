import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class SuspendUserDto {
  @ApiPropertyOptional({
    example: '2026-02-01T00:00:00.000Z',
    description:
      'Optional ISO timestamp. If provided, user is suspended until this time. If omitted, suspension is indefinite.',
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: 'suspendedUntil must be a valid ISO date string' },
  )
  suspendedUntil?: string;
}
