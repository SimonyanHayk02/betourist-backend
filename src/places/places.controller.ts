import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PlacesService } from './places.service';
import { ListPlacesQueryDto } from './dto/list-places.query.dto';
import { CreatePlaceDto } from './dto/create-place.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';

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

  @ApiOperation({
    summary:
      'Admin list places (includes unpublished, supports filtering and pagination)',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PlatformAdmin, UserRole.SuperAdmin)
  @Get('admin')
  async listAdmin(@Query() query: ListPlacesQueryDto) {
    return await this.placesService.listAdmin(query);
  }

  @ApiOperation({ summary: 'Get published place by id (public)' })
  @Get(':id')
  async getPublished(@Param('id') id: string) {
    const place = await this.placesService.getPublishedById(id);
    if (!place) throw new NotFoundException('Place not found');
    return place;
  }

  @ApiOperation({ summary: 'Get any place by id (admin-only)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PlatformAdmin, UserRole.SuperAdmin)
  @Get('admin/:id')
  async getAdmin(@Param('id') id: string) {
    const place = await this.placesService.getAnyById(id);
    if (!place) throw new NotFoundException('Place not found');
    return place;
  }

  @ApiOperation({ summary: 'Create place (admin-only)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PlatformAdmin, UserRole.SuperAdmin)
  @Post()
  async create(@Body() dto: CreatePlaceDto) {
    return await this.placesService.create(dto);
  }

  @ApiOperation({ summary: 'Publish place (admin-only)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PlatformAdmin, UserRole.SuperAdmin)
  @Patch(':id/publish')
  async publish(@Param('id') id: string) {
    return await this.placesService.setPublished(id, true);
  }

  @ApiOperation({ summary: 'Unpublish place (admin-only)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PlatformAdmin, UserRole.SuperAdmin)
  @Patch(':id/unpublish')
  async unpublish(@Param('id') id: string) {
    return await this.placesService.setPublished(id, false);
  }
}


