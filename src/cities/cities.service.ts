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
}


