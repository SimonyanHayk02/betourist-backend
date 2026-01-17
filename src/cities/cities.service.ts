import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCityDto } from './dto/create-city.dto';
import { randomUUID } from 'node:crypto';

@Injectable()
export class CitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCityDto) {
    // Prisma doesn't support PostGIS geography(Point,4326) natively.
    // We insert via parameterized raw SQL, then fetch via Prisma (which ignores Unsupported columns).
    const id = randomUUID();

    if (dto.wktLocation) {
      await this.prisma.$executeRaw`
        INSERT INTO "cities" ("id","createdAt","updatedAt","deletedAt","name","countryId","location")
        VALUES (${id}::uuid, now(), now(), NULL, ${dto.name}, ${dto.countryId}::uuid, ST_GeogFromText(${dto.wktLocation}))
      `;
    } else {
      await this.prisma.$executeRaw`
        INSERT INTO "cities" ("id","createdAt","updatedAt","deletedAt","name","countryId","location")
        VALUES (${id}::uuid, now(), now(), NULL, ${dto.name}, ${dto.countryId}::uuid, NULL)
      `;
    }

    return await this.prisma.city.findUnique({
      where: { id },
      include: { country: true },
    });
  }

  async findAll() {
    return await this.prisma.city.findMany({
      where: { deletedAt: null },
      include: { country: true },
      orderBy: { name: 'asc' },
    });
  }

  async findNearby(params: {
    lat: number;
    lng: number;
    radiusMeters: number;
    limit: number;
  }) {
    // Use PostGIS geography distance. Prisma returns plain objects from raw SQL.
    return await this.prisma.$queryRaw`
      SELECT
        c."id",
        c."name",
        c."countryId",
        ST_Distance(
          c."location",
          ST_SetSRID(ST_MakePoint(${params.lng}, ${params.lat}), 4326)::geography
        ) AS "distanceMeters"
      FROM "cities" c
      WHERE c."deletedAt" IS NULL
        AND c."location" IS NOT NULL
        AND ST_DWithin(
          c."location",
          ST_SetSRID(ST_MakePoint(${params.lng}, ${params.lat}), 4326)::geography,
          ${params.radiusMeters}
        )
      ORDER BY "distanceMeters" ASC
      LIMIT ${params.limit};
    `;
  }
}


