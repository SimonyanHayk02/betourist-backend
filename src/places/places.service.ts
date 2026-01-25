import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ListPlacesQueryDto } from './dto/list-places.query.dto';
import { CreatePlaceDto } from './dto/create-place.dto';
import { UpdatePlaceDto } from './dto/update-place.dto';
import { ListPlacesAdminQueryDto } from './dto/list-places-admin.query.dto';
import { ExperienceStatus } from '../common/enums/experience-status.enum';

type PlaceWithRelations = Prisma.PlaceGetPayload<{
  include: { city: true; category: true; media: true };
}>;

@Injectable()
export class PlacesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListPlacesQueryDto): Promise<{
    page: number;
    limit: number;
    total: number;
    items: PlaceWithRelations[];
  }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.PlaceWhereInput = {
      deletedAt: null,
      ...(query.cityId ? { cityId: query.cityId } : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.q
        ? { name: { contains: query.q, mode: 'insensitive' as const } }
        : {}),
    };

    // Public list is always published-only.
    where.isPublished = true;

    const [items, total] = await this.prisma.$transaction([
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

  async listAdmin(query: ListPlacesAdminQueryDto): Promise<{
    page: number;
    limit: number;
    total: number;
    items: PlaceWithRelations[];
  }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.PlaceWhereInput = {
      deletedAt: null,
      ...(query.cityId ? { cityId: query.cityId } : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.q
        ? { name: { contains: query.q, mode: 'insensitive' as const } }
        : {}),
    };

    if (query.isPublished === 'true') where.isPublished = true;
    if (query.isPublished === 'false') where.isPublished = false;

    const [items, total] = await this.prisma.$transaction([
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

  async getPublishedById(id: string): Promise<PlaceWithRelations | null> {
    return await this.prisma.place.findFirst({
      where: { id, deletedAt: null, isPublished: true },
      include: { city: true, category: true, media: true },
    });
  }

  async getAnyById(id: string): Promise<PlaceWithRelations | null> {
    return await this.prisma.place.findFirst({
      where: { id, deletedAt: null },
      include: { city: true, category: true, media: true },
    });
  }

  async update(
    placeId: string,
    dto: UpdatePlaceDto,
  ): Promise<PlaceWithRelations> {
    return await this.prisma.$transaction(async (tx) => {
      const data: Prisma.PlaceUpdateInput = {};

      if (dto.name !== undefined) data.name = dto.name;
      if (dto.description !== undefined) data.description = dto.description;
      if (dto.categoryId !== undefined) {
        data.category = dto.categoryId
          ? { connect: { id: dto.categoryId } }
          : { disconnect: true };
      }

      const updatedPlace = await tx.place.update({
        where: { id: placeId },
        data,
      });

      if (dto.mediaUrls !== undefined) {
        await tx.placeMedia.deleteMany({
          where: { placeId },
        });
        if (dto.mediaUrls.length) {
          await tx.placeMedia.createMany({
            data: dto.mediaUrls.map((url, idx) => ({
              placeId,
              url,
              sortOrder: idx,
            })),
          });
        }
      }

      const updated = await tx.place.findUnique({
        where: { id: updatedPlace.id },
        include: { city: true, category: true, media: true },
      });
      if (!updated) throw new NotFoundException('Place not found');
      return updated;
    });
  }

  async softDelete(placeId: string): Promise<PlaceWithRelations> {
    return await this.prisma.place.update({
      where: { id: placeId },
      data: { deletedAt: new Date() },
      include: { city: true, category: true, media: true },
    });
  }

  async restore(placeId: string): Promise<PlaceWithRelations> {
    return await this.prisma.place.update({
      where: { id: placeId },
      data: { deletedAt: null },
      include: { city: true, category: true, media: true },
    });
  }

  async create(dto: CreatePlaceDto): Promise<PlaceWithRelations> {
    return await this.prisma.place.create({
      data: {
        name: dto.name,
        description: dto.description ?? null,
        isPublished: false,
        status: ExperienceStatus.Draft,
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

  async setPublished(
    placeId: string,
    isPublished: boolean,
  ): Promise<PlaceWithRelations> {
    return await this.prisma.place.update({
      where: { id: placeId },
      data: isPublished
        ? ({
            isPublished: true,
            status: ExperienceStatus.Published,
            publishedAt: new Date(),
            rejectionReason: null,
          } satisfies Prisma.PlaceUpdateInput)
        : ({
            isPublished: false,
            status: ExperienceStatus.Unpublished,
          } satisfies Prisma.PlaceUpdateInput),
      include: { city: true, category: true, media: true },
    });
  }
}
