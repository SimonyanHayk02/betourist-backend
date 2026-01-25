import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class SetSelectedCityDto {
  @ApiProperty({ example: 'bf291080-71c3-4615-8fdd-06d31ca5ef85' })
  @IsUUID('4', { message: 'cityId must be a UUID' })
  cityId!: string;
}
