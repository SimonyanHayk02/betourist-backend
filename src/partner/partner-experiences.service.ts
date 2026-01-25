import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PartnerService } from './partner.service';
import { CreatePartnerExperienceDto } from './dto/create-partner-experience.dto';
import { UpdatePartnerExperienceDto } from './dto/update-partner-experience.dto';
import { ListPartnerExperiencesQueryDto } from './dto/list-partner-experiences.query.dto';
import { ExperienceStatus } from '../common/enums/experience-status.enum';

type PartnerExperienceItem = Prisma.PlaceGetPayload<{
  include: { city: true; category: true; media: true; partner: true };
}>;

@Injectable()
export class PartnerExperiencesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly partnerService: PartnerService,
  ) {}

  async list(
    userId: string,
    query: ListPartnerExperiencesQueryDto,
  ): Promise<{
    page: number;
    limit: number;
    total: number;
    items: PartnerExperienceItem[];
  }> {
    const partner = await this.partnerService.getOwnedPartnerOrThrow(userId);

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.PlaceWhereInput = {
      deletedAt: null,
      partnerId: partner.id,
      ...(query.status ? { status: query.status } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.place.findMany({
        where,
        orderBy: [{ updatedAt: 'desc' }],
        skip,
        take: limit,
        include: { city: true, category: true, media: true, partner: true },
      }),
      this.prisma.place.count({ where }),
    ]);

    return { page, limit, total, items };
  }

  async create(
    userId: string,
    dto: CreatePartnerExperienceDto,
  ): Promise<PartnerExperienceItem> {
    const partner = await this.partnerService.getOwnedPartnerOrThrow(userId);

    return await this.prisma.place.create({
      data: {
        name: dto.title,
        description: dto.description ?? null,
        cityId: dto.cityId,
        categoryId: dto.categoryId ?? null,
        partnerId: partner.id,
        isPublished: false,
        status: ExperienceStatus.Draft,
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

  async update(
    userId: string,
    id: string,
    dto: UpdatePartnerExperienceDto,
  ): Promise<PartnerExperienceItem> {
    const partner = await this.partnerService.getOwnedPartnerOrThrow(userId);

    const existing = await this.prisma.place.findFirst({
      where: { id, deletedAt: null, partnerId: partner.id },
      select: { id: true, status: true },
    });
    if (!existing) throw new NotFoundException('Experience not found');
    const currentStatus = existing.status as ExperienceStatus;
    if (currentStatus !== ExperienceStatus.Draft) {
      throw new BadRequestException('Only draft experiences can be edited');
    }

    return await this.prisma.$transaction(async (tx) => {
      const data: Prisma.PlaceUpdateInput = {};
      if (dto.title !== undefined) data.name = dto.title;
      if (dto.description !== undefined)
        data.description = dto.description ?? null;
      if (dto.cityId !== undefined) {
        data.city = { connect: { id: dto.cityId } };
      }
      if (dto.categoryId !== undefined) {
        data.category = dto.categoryId
          ? { connect: { id: dto.categoryId } }
          : { disconnect: true };
      }
      if (dto.priceFromCents !== undefined)
        data.priceFromCents = dto.priceFromCents;
      if (dto.currency !== undefined)
        data.currency = dto.currency ? dto.currency.toUpperCase() : null;

      await tx.place.update({
        where: { id: existing.id },
        data,
      });

      if (dto.mediaUrls !== undefined) {
        await tx.placeMedia.deleteMany({
          where: { placeId: existing.id },
        });
        if (dto.mediaUrls.length) {
          await tx.placeMedia.createMany({
            data: dto.mediaUrls.map((url, idx) => ({
              placeId: existing.id,
              url,
              sortOrder: idx,
            })),
          });
        }
      }

      const updated = await tx.place.findUnique({
        where: { id: existing.id },
        include: { city: true, category: true, media: true, partner: true },
      });
      if (!updated) throw new NotFoundException('Experience not found');
      return updated;
    });
  }

  async submit(userId: string, id: string): Promise<PartnerExperienceItem> {
    const partner = await this.partnerService.getOwnedPartnerOrThrow(userId);

    const existing = await this.prisma.place.findFirst({
      where: { id, deletedAt: null, partnerId: partner.id },
      select: { id: true, status: true },
    });
    if (!existing) throw new NotFoundException('Experience not found');
    const currentStatus = existing.status as ExperienceStatus;
    if (currentStatus !== ExperienceStatus.Draft) {
      throw new BadRequestException('Only draft experiences can be submitted');
    }

    return await this.prisma.place.update({
      where: { id: existing.id },
      data: {
        status: ExperienceStatus.PendingReview,
        isPublished: false,
        rejectionReason: null,
      },
      include: { city: true, category: true, media: true, partner: true },
    });
  }
}
