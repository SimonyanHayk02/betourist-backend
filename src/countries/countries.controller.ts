import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CountriesService } from './countries.service';
import { CreateCountryDto } from './dto/create-country.dto';

@ApiTags('countries')
@Controller('countries')
export class CountriesController {
  constructor(private readonly countriesService: CountriesService) {}

  @ApiOperation({ summary: 'List countries' })
  @Get()
  async list() {
    return await this.countriesService.findAll();
  }

  @ApiOperation({ summary: 'Create country (dev/admin for now)' })
  @Post()
  async create(@Body() dto: CreateCountryDto) {
    return await this.countriesService.create(dto);
  }
}


