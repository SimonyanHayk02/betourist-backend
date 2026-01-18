import { ApiProperty } from '@nestjs/swagger';

export class CategoryPublicDto {
  @ApiProperty({ example: 'a64524d2-1fae-46c9-a6fe-cabfc6a91277' })
  id!: string;

  @ApiProperty({ example: 'Glamping' })
  name!: string;

  @ApiProperty({ example: 'glamping' })
  slug!: string;
}


