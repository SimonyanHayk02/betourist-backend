import { Body, Controller, Get, Post } from '@nestjs/common';
import { CountriesService } from './countries.service';
import { CreateCountryDto } from './dto/create-country.dto';

@Controller('countries')
export class CountriesController {
  constructor(private readonly countriesService: CountriesService) {}

  @Get()
  async list() {
    return await this.countriesService.findAll();
  }

  @Post()
  async create(@Body() dto: CreateCountryDto) {
    return await this.countriesService.create(dto);
  }
}


