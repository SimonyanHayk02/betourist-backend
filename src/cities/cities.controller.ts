import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CitiesService } from './cities.service';
import { CreateCityDto } from './dto/create-city.dto';
import { NearbyCitiesQueryDto } from './dto/nearby-cities.query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';

@ApiTags('cities')
@Controller('cities')
export class CitiesController {
  constructor(private readonly citiesService: CitiesService) {}

  @ApiOperation({ summary: 'List cities (includes country)' })
  @Get()
  async list() {
    return await this.citiesService.findAll();
  }

  @ApiOperation({
    summary: 'Find cities within radius (meters) from a point (lat/lng)',
  })
  @Get('near')
  async near(@Query() query: NearbyCitiesQueryDto) {
    return await this.citiesService.findNearby(query);
  }

  @ApiOperation({ summary: 'Create city (dev/admin for now)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PlatformAdmin, UserRole.SuperAdmin)
  @Post()
  async create(@Body() dto: CreateCityDto) {
    return await this.citiesService.create(dto);
  }
}
