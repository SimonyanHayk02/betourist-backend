import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';

const EXPERIENCE_STATUSES = [
  'draft',
  'pending_review',
  'published',
  'unpublished',
] as const;

export class ListPartnerExperiencesQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Filter by status (draft, pending_review, published, unpublished)',
    example: 'draft',
    enum: EXPERIENCE_STATUSES,
  })
  @IsOptional()
  @IsString()
  @IsIn(EXPERIENCE_STATUSES)
  status?: string;
}


