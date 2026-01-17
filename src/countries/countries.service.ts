import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCountryDto } from './dto/create-country.dto';

@Injectable()
export class CountriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCountryDto) {
    return await this.prisma.country.create({
      data: {
        name: dto.name,
        isoCode2: dto.isoCode2.toUpperCase(),
        isoCode3: dto.isoCode3?.toUpperCase() ?? null,
      },
    });
  }

  async findAll() {
    return await this.prisma.country.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }
}


