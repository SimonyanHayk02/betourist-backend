import { Body, Controller, Get, Post } from '@nestjs/common';
import { CitiesService } from './cities.service';
import { CreateCityDto } from './dto/create-city.dto';

@Controller('cities')
export class CitiesController {
  constructor(private readonly citiesService: CitiesService) {}

  @Get()
  async list() {
    return await this.citiesService.findAll();
  }

  @Post()
  async create(@Body() dto: CreateCityDto) {
    return await this.citiesService.create(dto);
  }
}


