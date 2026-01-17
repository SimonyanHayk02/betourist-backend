import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ListPlacesQueryDto } from './dto/list-places.query.dto';

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
}


