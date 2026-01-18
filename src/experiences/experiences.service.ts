import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ListExperiencesQueryDto } from './dto/list-experiences.query.dto';

@Injectable()
export class ExperiencesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListExperiencesQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const featured =
      query.featured === undefined ? true : query.featured.toLowerCase() === 'true';

    const where: any = {
      deletedAt: null,
      isPublished: true,
      ...(featured ? { isFeatured: true } : {}),
      ...(query.cityId ? { cityId: query.cityId } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.place.findMany({
        where,
        orderBy: [{ updatedAt: 'desc' }],
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          description: true,
          isFeatured: true,
          priceFromCents: true,
          currency: true,
          ratingAvg: true,
          ratingCount: true,
          category: { select: { id: true, name: true, slug: true } },
          city: { select: { id: true, name: true } },
          media: {
            where: { deletedAt: null },
            orderBy: { sortOrder: 'asc' },
            take: 1,
            select: { url: true },
          },
        },
      }),
      this.prisma.place.count({ where }),
    ]);

    return {
      page,
      limit,
      total,
      items: items.map((p) => ({
        id: p.id,
        title: p.name,
        shortDescription: p.description ?? null,
        featured: p.isFeatured,
        heroImageUrl: p.media[0]?.url ?? null,
        priceFromCents: p.priceFromCents ?? null,
        currency: p.currency ?? null,
        ratingAvg: p.ratingAvg ?? 0,
        ratingCount: p.ratingCount ?? 0,
        category: p.category
          ? { id: p.category.id, name: p.category.name, slug: p.category.slug }
          : null,
        city: { id: p.city.id, name: p.city.name },
      })),
    };
  }

  async getById(id: string) {
    const place = await this.prisma.place.findFirst({
      where: { id, deletedAt: null, isPublished: true },
      select: {
        id: true,
        name: true,
        description: true,
        isFeatured: true,
        priceFromCents: true,
        currency: true,
        ratingAvg: true,
        ratingCount: true,
        category: { select: { id: true, name: true, slug: true } },
        city: { select: { id: true, name: true } },
        media: {
          where: { deletedAt: null },
          orderBy: { sortOrder: 'asc' },
          select: { url: true, sortOrder: true },
        },
      },
    });

    if (!place) throw new NotFoundException('Experience not found');

    const geo = await this.getGeo(place.id);

    return {
      id: place.id,
      title: place.name,
      description: place.description ?? null,
      featured: place.isFeatured,
      heroImageUrl: place.media[0]?.url ?? null,
      priceFromCents: place.priceFromCents ?? null,
      currency: place.currency ?? null,
      ratingAvg: place.ratingAvg ?? 0,
      ratingCount: place.ratingCount ?? 0,
      category: place.category
        ? { id: place.category.id, name: place.category.name, slug: place.category.slug }
        : null,
      city: { id: place.city.id, name: place.city.name },
      geo,
      gallery: place.media.map((m) => ({ url: m.url, sortOrder: m.sortOrder })),
    };
  }

  private async getGeo(placeId: string): Promise<{ lat: number | null; lng: number | null }> {
    const rows = await this.prisma.$queryRaw<
      Array<{ lat: number | null; lng: number | null }>
    >`
      SELECT
        CASE WHEN "location" IS NULL THEN NULL ELSE ST_Y("location"::geometry) END AS "lat",
        CASE WHEN "location" IS NULL THEN NULL ELSE ST_X("location"::geometry) END AS "lng"
      FROM "places"
      WHERE "id" = ${placeId}::uuid
      LIMIT 1
    `;

    const row = rows[0];
    return { lat: row?.lat ?? null, lng: row?.lng ?? null };
  }
}


