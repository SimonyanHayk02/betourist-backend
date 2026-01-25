import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ListExperiencesQueryDto } from './dto/list-experiences.query.dto';
import { ExperienceStatus } from '../common/enums/experience-status.enum';

type ExperienceDetailsItem = Prisma.PlaceGetPayload<{
  select: {
    id: true;
    name: true;
    description: true;
    isFeatured: true;
    status: true;
    publishedAt: true;
    priceFromCents: true;
    currency: true;
    ratingAvg: true;
    ratingCount: true;
    category: { select: { id: true; name: true; slug: true } };
    city: { select: { id: true; name: true } };
    media: { select: { url: true; sortOrder: true } };
  };
}>;

@Injectable()
export class ExperiencesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListExperiencesQueryDto) {
    const limit = query.limit ?? 10;
    const offset = query.offset ?? (query.page ? (query.page - 1) * limit : 0);
    const page = query.page ?? Math.floor(offset / limit) + 1;
    const skip = offset;

    const featured =
      query.featured === undefined
        ? true
        : query.featured.toLowerCase() === 'true';

    const where: Prisma.PlaceWhereInput = {
      deletedAt: null,
      status: ExperienceStatus.Published,
      ...(featured ? { isFeatured: true } : {}),
      ...(query.cityId ? { cityId: query.cityId } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
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

    const mappedItems = items.map((p) => {
      const heroImageUrl = p.media[0]?.url ?? null;
      const shortDescription = p.description ?? null;
      const ratingAvg = p.ratingAvg ?? 0;
      const ratingCount = p.ratingCount ?? 0;
      const category = p.category
        ? { id: p.category.id, name: p.category.name, slug: p.category.slug }
        : null;
      const city = { id: p.city.id, name: p.city.name };

      // Keep existing fields + add frontend-spec aliases.
      return {
        id: p.id,
        title: p.name,
        shortDescription,
        featured: p.isFeatured,
        heroImageUrl,
        priceFromCents: p.priceFromCents ?? null,
        currency: p.currency ?? null,
        ratingAvg,
        ratingCount,
        category,
        city,

        // Frontend contract (API_SPECIFICATION_HOMESCREEN.md)
        subtitle: shortDescription,
        imageUrl: heroImageUrl,
        categoryId: category?.id ?? null,
        cityId: city.id,
        rating: ratingAvg,
        reviewCount: ratingCount,
        price: {
          amount: p.priceFromCents ?? null,
          currency: p.currency ?? null,
          per: null,
        },
      };
    });

    return {
      // Existing response shape (keep)
      page,
      limit,
      total,
      items: mappedItems,

      // Frontend response shape (additive)
      data: mappedItems,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + mappedItems.length < total,
      },
    };
  }

  async getById(id: string) {
    const place: ExperienceDetailsItem | null =
      await this.prisma.place.findFirst({
        where: { id, deletedAt: null, status: ExperienceStatus.Published },
        select: {
          id: true,
          name: true,
          description: true,
          isFeatured: true,
          status: true,
          publishedAt: true,
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

    const heroImageUrl = place.media[0]?.url ?? null;
    const galleryItems = place.media.map((m) => ({
      url: m.url,
      sortOrder: m.sortOrder,
    }));
    const galleryUrls = place.media.map((m) => m.url);
    const ratingAvg = place.ratingAvg ?? 0;
    const ratingCount = place.ratingCount ?? 0;
    const category = place.category
      ? {
          id: place.category.id,
          name: place.category.name,
          slug: place.category.slug,
        }
      : null;
    const city = { id: place.city.id, name: place.city.name };

    return {
      // Existing response fields (keep)
      id: place.id,
      title: place.name,
      description: place.description ?? null,
      featured: place.isFeatured,
      heroImageUrl,
      priceFromCents: place.priceFromCents ?? null,
      currency: place.currency ?? null,
      ratingAvg,
      ratingCount,
      category,
      city,
      geo,

      // CHANGE for frontend contract: provide string[] gallery as `gallery`
      // Keep old structured items under `galleryItems`.
      gallery: galleryUrls,
      galleryItems,

      // Frontend contract aliases
      subtitle: place.description ?? null,
      imageUrl: heroImageUrl,
      categoryId: category?.id ?? null,
      cityId: city.id,
      rating: ratingAvg,
      reviewCount: ratingCount,
      coordinates: { latitude: geo.lat, longitude: geo.lng },
      price: {
        amount: place.priceFromCents ?? null,
        currency: place.currency ?? null,
        per: null,
      },

      // Spec fields we don't support in MVP: return null/empty (safe for UI)
      location: null,
      duration: null,
      amenities: [],
      highlights: [],
      availableDates: [],
    };
  }

  private async getGeo(
    placeId: string,
  ): Promise<{ lat: number | null; lng: number | null }> {
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
