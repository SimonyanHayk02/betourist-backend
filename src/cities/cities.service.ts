import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCityDto } from './dto/create-city.dto';

@Injectable()
export class CitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCityDto) {
    // Prisma doesn't support PostGIS geography(Point,4326) natively; use parameterized raw SQL.
    if (dto.wktLocation) {
      return await this.prisma.$queryRaw`
        INSERT INTO "cities" ("id","createdAt","updatedAt","deletedAt","name","countryId","location")
        VALUES (gen_random_uuid(), now(), now(), NULL, ${dto.name}, ${dto.countryId}, ST_GeogFromText(${dto.wktLocation}))
        RETURNING *;
      `;
    }

    return await this.prisma.$queryRaw`
      INSERT INTO "cities" ("id","createdAt","updatedAt","deletedAt","name","countryId","location")
      VALUES (gen_random_uuid(), now(), now(), NULL, ${dto.name}, ${dto.countryId}, NULL)
      RETURNING *;
    `;
  }

  async findAll() {
    return await this.prisma.city.findMany({
      where: { deletedAt: null },
      include: { country: true },
      orderBy: { name: 'asc' },
    });
  }
}


