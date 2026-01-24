import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PartnerService {
  constructor(private readonly prisma: PrismaService) {}

  async getOwnedPartner(userId: string) {
    return await (this.prisma as any).partner.findFirst({
      where: { ownerId: userId, deletedAt: null },
    });
  }

  async getOwnedPartnerOrThrow(userId: string) {
    const partner = await this.getOwnedPartner(userId);
    if (!partner) throw new BadRequestException('Partner profile not found');
    return partner;
  }

  async createOwnedPartner(userId: string, name: string) {
    return await this.prisma.$transaction(async (tx) => {
      const existing = await (tx as any).partner.findFirst({
        where: { ownerId: userId, deletedAt: null },
      });
      if (existing) {
        throw new BadRequestException('Partner profile already exists for this user');
      }

      const partner = await (tx as any).partner.create({
        data: { name, ownerId: userId },
      });

      // Convenience for future: link user.partnerId to the owned partner.
      await (tx as any).user.update({
        where: { id: userId },
        data: { partnerId: partner.id },
      });

      return partner;
    });
  }
}


