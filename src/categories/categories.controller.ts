import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @ApiOperation({ summary: 'List categories (public)' })
  @Get()
  async list() {
    const items = await this.categoriesService.findAll();
    // Frontend home screen expects `icon`. For MVP, map icon identifier from slug.
    // Keep extra DB fields as-is to avoid breaking any existing consumers.
    return items.map((c: any) => ({
      ...c,
      icon: c.slug,
    }));
  }

  @ApiOperation({ summary: 'Create category (admin-only)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PlatformAdmin, UserRole.SuperAdmin)
  @Post()
  async create(@Body() dto: CreateCategoryDto) {
    return await this.categoriesService.create(dto);
  }

  @ApiOperation({ summary: 'Update category (admin-only)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PlatformAdmin, UserRole.SuperAdmin)
  @Patch('admin/:id')
  async update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return await this.categoriesService.update(id, dto);
  }

  @ApiOperation({ summary: 'Soft delete category (admin-only)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PlatformAdmin, UserRole.SuperAdmin)
  @Delete('admin/:id')
  async softDelete(@Param('id') id: string) {
    return await this.categoriesService.softDelete(id);
  }
}


