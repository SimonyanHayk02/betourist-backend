import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ListPlacesQueryDto } from './dto/list-places.query.dto';
import { CreatePlaceDto } from './dto/create-place.dto';

@Injectable()
export class PlacesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListPlacesQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
      ...(query.cityId ? { cityId: query.cityId } : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.q
        ? { name: { contains: query.q, mode: 'insensitive' as const } }
        : {}),
    };

    // Default: public-only list of published places
    if (query.includeUnpublished !== 'true') {
      where.isPublished = true;
    }

    const [items, total] = await Promise.all([
      this.prisma.place.findMany({
        where,
        include: { city: true, category: true, media: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.place.count({ where }),
    ]);

    return {
      page,
      limit,
      total,
      items,
    };
  }

  async listAdmin(query: ListPlacesQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
      ...(query.cityId ? { cityId: query.cityId } : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.q
        ? { name: { contains: query.q, mode: 'insensitive' as const } }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.place.findMany({
        where,
        include: { city: true, category: true, media: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.place.count({ where }),
    ]);

    return { page, limit, total, items };
  }

  async getPublishedById(id: string) {
    return await this.prisma.place.findFirst({
      where: { id, deletedAt: null, isPublished: true },
      include: { city: true, category: true, media: true },
    });
  }

  async getAnyById(id: string) {
    return await this.prisma.place.findFirst({
      where: { id, deletedAt: null },
      include: { city: true, category: true, media: true },
    });
  }

  async create(dto: CreatePlaceDto) {
    return await this.prisma.place.create({
      data: {
        name: dto.name,
        description: dto.description ?? null,
        isPublished: false,
        cityId: dto.cityId,
        categoryId: dto.categoryId ?? null,
        media: dto.mediaUrls?.length
          ? {
              create: dto.mediaUrls.map((url, idx) => ({
                url,
                sortOrder: idx,
              })),
            }
          : undefined,
      },
      include: { city: true, category: true, media: true },
    });
  }

  async setPublished(placeId: string, isPublished: boolean) {
    return await this.prisma.place.update({
      where: { id: placeId },
      data: { isPublished },
      include: { city: true, category: true, media: true },
    });
  }
}


