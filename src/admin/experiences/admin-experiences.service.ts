import { Injectable, NotFoundException } from '@nestjs/common';
import { BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ListPendingExperiencesQueryDto } from './dto/list-pending-experiences.query.dto';

@Injectable()
export class AdminExperiencesService {
  constructor(private readonly prisma: PrismaService) {}

  async listPending(query: ListPendingExperiencesQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
      status: 'pending_review',
    };

    const [items, total] = await Promise.all([
      (this.prisma as any).place.findMany({
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
      (this.prisma as any).place.count({ where }),
    ]);

    return { page, limit, total, items };
  }

  async approve(id: string) {
    const result = await (this.prisma as any).place.updateMany({
      where: { id, deletedAt: null, status: 'pending_review' },
      data: {
        status: 'published',
        isPublished: true,
        publishedAt: new Date(),
        rejectionReason: null,
        // MVP: ensure it appears on home (home endpoint defaults featured=true)
        isFeatured: true,
      },
    });

    if (result.count === 0) {
      const exists = await (this.prisma as any).place.findFirst({
        where: { id, deletedAt: null },
        select: { id: true, status: true },
      });
      if (!exists) throw new NotFoundException('Experience not found');
      throw new BadRequestException('Only pending_review experiences can be approved');
    }

    return await (this.prisma as any).place.findUnique({
      where: { id },
      select: { id: true, status: true, publishedAt: true, rejectionReason: true },
    });
  }

  async reject(id: string, rejectionReason?: string) {
    const result = await (this.prisma as any).place.updateMany({
      where: { id, deletedAt: null, status: 'pending_review' },
      data: {
        status: 'draft',
        isPublished: false,
        publishedAt: null,
        isFeatured: false,
        rejectionReason: rejectionReason ?? null,
      },
    });

    if (result.count === 0) {
      const exists = await (this.prisma as any).place.findFirst({
        where: { id, deletedAt: null },
        select: { id: true, status: true },
      });
      if (!exists) throw new NotFoundException('Experience not found');
      throw new BadRequestException('Only pending_review experiences can be rejected');
    }

    return await (this.prisma as any).place.findUnique({
      where: { id },
      select: { id: true, status: true, publishedAt: true, rejectionReason: true },
    });
  }
}


