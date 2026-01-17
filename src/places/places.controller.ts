import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PlacesService } from './places.service';
import { ListPlacesQueryDto } from './dto/list-places.query.dto';

@ApiTags('places')
@Controller('places')
export class PlacesController {
  constructor(private readonly placesService: PlacesService) {}

  @ApiOperation({
    summary: 'List published places (supports filtering and pagination)',
  })
  @Get()
  async list(@Query() query: ListPlacesQueryDto) {
    return await this.placesService.list(query);
  }
}


