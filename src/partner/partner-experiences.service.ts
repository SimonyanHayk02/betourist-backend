import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PartnerService } from './partner.service';
import { CreatePartnerExperienceDto } from './dto/create-partner-experience.dto';
import { UpdatePartnerExperienceDto } from './dto/update-partner-experience.dto';
import { ListPartnerExperiencesQueryDto } from './dto/list-partner-experiences.query.dto';

@Injectable()
export class PartnerExperiencesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly partnerService: PartnerService,
  ) {}

  async list(userId: string, query: ListPartnerExperiencesQueryDto) {
    const partner = await this.partnerService.getOwnedPartnerOrThrow(userId);

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
      partnerId: partner.id,
      ...(query.status ? { status: query.status } : {}),
    };

    const [items, total] = await Promise.all([
      (this.prisma as any).place.findMany({
        where,
        orderBy: [{ updatedAt: 'desc' }],
        skip,
        take: limit,
        include: { city: true, category: true, media: true, partner: true },
      }),
      (this.prisma as any).place.count({ where }),
    ]);

    return { page, limit, total, items };
  }

  async create(userId: string, dto: CreatePartnerExperienceDto) {
    const partner = await this.partnerService.getOwnedPartnerOrThrow(userId);

    return await (this.prisma as any).place.create({
      data: {
        name: dto.title,
        description: dto.description ?? null,
        cityId: dto.cityId,
        categoryId: dto.categoryId ?? null,
        partnerId: partner.id,
        isPublished: false,
        status: 'draft',
        isFeatured: false,
        priceFromCents: dto.priceFromCents ?? null,
        currency: dto.currency ? dto.currency.toUpperCase() : null,
        media: dto.mediaUrls?.length
          ? {
              create: dto.mediaUrls.map((url, idx) => ({
                url,
                sortOrder: idx,
              })),
            }
          : undefined,
      },
      include: { city: true, category: true, media: true, partner: true },
    });
  }

  async update(userId: string, id: string, dto: UpdatePartnerExperienceDto) {
    const partner = await this.partnerService.getOwnedPartnerOrThrow(userId);

    const existing = await (this.prisma as any).place.findFirst({
      where: { id, deletedAt: null, partnerId: partner.id },
      select: { id: true, status: true },
    });
    if (!existing) throw new NotFoundException('Experience not found');
    if (existing.status !== 'draft') {
      throw new BadRequestException('Only draft experiences can be edited');
    }

    return await this.prisma.$transaction(async (tx) => {
      const data: any = {};
      if (dto.title !== undefined) data.name = dto.title;
      if (dto.description !== undefined) data.description = dto.description ?? null;
      if (dto.cityId !== undefined) data.cityId = dto.cityId;
      if (dto.categoryId !== undefined) data.categoryId = dto.categoryId ?? null;
      if (dto.priceFromCents !== undefined) data.priceFromCents = dto.priceFromCents;
      if (dto.currency !== undefined)
        data.currency = dto.currency ? dto.currency.toUpperCase() : null;

      await (tx as any).place.update({
        where: { id: existing.id },
        data,
      });

      if (dto.mediaUrls !== undefined) {
        await (tx as any).placeMedia.deleteMany({ where: { placeId: existing.id } });
        if (dto.mediaUrls.length) {
          await (tx as any).placeMedia.createMany({
            data: dto.mediaUrls.map((url, idx) => ({
              placeId: existing.id,
              url,
              sortOrder: idx,
            })),
          });
        }
      }

      return await (tx as any).place.findUnique({
        where: { id: existing.id },
        include: { city: true, category: true, media: true, partner: true },
      });
    });
  }

  async submit(userId: string, id: string) {
    const partner = await this.partnerService.getOwnedPartnerOrThrow(userId);

    const existing = await (this.prisma as any).place.findFirst({
      where: { id, deletedAt: null, partnerId: partner.id },
      select: { id: true, status: true },
    });
    if (!existing) throw new NotFoundException('Experience not found');
    if (existing.status !== 'draft') {
      throw new BadRequestException('Only draft experiences can be submitted');
    }

    return await (this.prisma as any).place.update({
      where: { id: existing.id },
      data: {
        status: 'pending_review',
        isPublished: false,
        rejectionReason: null,
      },
      include: { city: true, category: true, media: true, partner: true },
    });
  }
}


