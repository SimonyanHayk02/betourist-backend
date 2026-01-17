import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CitiesService } from './cities.service';
import { CreateCityDto } from './dto/create-city.dto';

@ApiTags('cities')
@Controller('cities')
export class CitiesController {
  constructor(private readonly citiesService: CitiesService) {}

  @ApiOperation({ summary: 'List cities (includes country)' })
  @Get()
  async list() {
    return await this.citiesService.findAll();
  }

  @ApiOperation({ summary: 'Create city (dev/admin for now)' })
  @Post()
  async create(@Body() dto: CreateCityDto) {
    return await this.citiesService.create(dto);
  }
}


