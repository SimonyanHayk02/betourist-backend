import { BadRequestException, Injectable } from '@nestjs/common';
import { Partner } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PartnerService {
  constructor(private readonly prisma: PrismaService) {}

  async getOwnedPartner(userId: string): Promise<Partner | null> {
    return await this.prisma.partner.findFirst({
      where: { ownerId: userId, deletedAt: null },
    });
  }

  async getOwnedPartnerOrThrow(userId: string): Promise<Partner> {
    const partner = await this.getOwnedPartner(userId);
    if (!partner) throw new BadRequestException('Partner profile not found');
    return partner;
  }

  async createOwnedPartner(userId: string, name: string): Promise<Partner> {
    return await this.prisma.$transaction(async (tx) => {
      const existing = await tx.partner.findFirst({
        where: { ownerId: userId, deletedAt: null },
      });
      if (existing) {
        throw new BadRequestException(
          'Partner profile already exists for this user',
        );
      }

      const partner = await tx.partner.create({
        data: { name, ownerId: userId },
      });

      // Convenience for future: link user.partnerId to the owned partner.
      await tx.user.update({
        where: { id: userId },
        data: { partnerId: partner.id },
      });

      return partner;
    });
  }
}
