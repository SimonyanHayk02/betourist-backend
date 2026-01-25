import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ListPendingExperiencesQueryDto } from './dto/list-pending-experiences.query.dto';
import { ExperienceStatus } from '../../common/enums/experience-status.enum';

type PendingExperienceItem = Prisma.PlaceGetPayload<{
  include: {
    city: { include: { country: true } };
    category: true;
    media: true;
    partner: true;
  };
}>;

type ExperienceStatusResult = Prisma.PlaceGetPayload<{
  select: {
    id: true;
    status: true;
    publishedAt: true;
    rejectionReason: true;
  };
}>;

@Injectable()
export class AdminExperiencesService {
  constructor(private readonly prisma: PrismaService) {}

  async listPending(query: ListPendingExperiencesQueryDto): Promise<{
    page: number;
    limit: number;
    total: number;
    items: PendingExperienceItem[];
  }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.PlaceWhereInput = {
      deletedAt: null,
      status: ExperienceStatus.PendingReview,
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.place.findMany({
        where,
        orderBy: [{ updatedAt: 'desc' }],
        skip,
        take: limit,
        include: {
          city: { include: { country: true } },
          category: true,
          media: true,
          partner: true,
        },
      }),
      this.prisma.place.count({ where }),
    ]);

    return { page, limit, total, items };
  }

  async approve(id: string): Promise<ExperienceStatusResult> {
    const result = await this.prisma.place.updateMany({
      where: { id, deletedAt: null, status: ExperienceStatus.PendingReview },
      data: {
        status: ExperienceStatus.Published,
        isPublished: true,
        publishedAt: new Date(),
        rejectionReason: null,
        // MVP: ensure it appears on home (home endpoint defaults featured=true)
        isFeatured: true,
      },
    });

    if (result.count === 0) {
      const exists = await this.prisma.place.findFirst({
        where: { id, deletedAt: null },
        select: { id: true, status: true },
      });
      if (!exists) throw new NotFoundException('Experience not found');
      throw new BadRequestException(
        'Only pending_review experiences can be approved',
      );
    }

    const updated = await this.prisma.place.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        publishedAt: true,
        rejectionReason: true,
      },
    });
    if (!updated) throw new NotFoundException('Experience not found');
    return updated;
  }

  async reject(
    id: string,
    rejectionReason?: string,
  ): Promise<ExperienceStatusResult> {
    const result = await this.prisma.place.updateMany({
      where: { id, deletedAt: null, status: ExperienceStatus.PendingReview },
      data: {
        status: ExperienceStatus.Draft,
        isPublished: false,
        publishedAt: null,
        isFeatured: false,
        rejectionReason: rejectionReason ?? null,
      },
    });

    if (result.count === 0) {
      const exists = await this.prisma.place.findFirst({
        where: { id, deletedAt: null },
        select: { id: true, status: true },
      });
      if (!exists) throw new NotFoundException('Experience not found');
      throw new BadRequestException(
        'Only pending_review experiences can be rejected',
      );
    }

    const updated = await this.prisma.place.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        publishedAt: true,
        rejectionReason: true,
      },
    });
    if (!updated) throw new NotFoundException('Experience not found');
    return updated;
  }
}
