import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCategoryDto) {
    return await this.prisma.category.create({
      data: {
        name: dto.name,
        slug: dto.slug,
      },
    });
  }

  async findAll() {
    return await this.prisma.category.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    return await this.prisma.category.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.slug !== undefined ? { slug: dto.slug } : {}),
      },
    });
  }

  async softDelete(id: string) {
    return await this.prisma.category.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}


