import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '../common/enums/user-role.enum';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly meSelect = {
    id: true,
    createdAt: true,
    updatedAt: true,
    email: true,
    phone: true,
    role: true,
    verificationStatus: true,
    isActive: true,
    isSuspended: true,
    suspendedUntil: true,
    selectedCityId: true,
    selectedCity: {
      select: {
        id: true,
        name: true,
        heroImageUrl: true,
        country: { select: { id: true, name: true, isoCode2: true, isoCode3: true } },
      },
    },
  } as const;

  async findByEmail(email: string) {
    return await this.prisma.user.findUnique({ where: { email } });
  }

  async findByPhone(phone: string) {
    return await this.prisma.user.findUnique({ where: { phone } });
  }

  async findById(id: string) {
    return await this.prisma.user.findUnique({ where: { id } });
  }

  async createTouristUser(input: {
    email?: string;
    phone?: string;
    passwordHash: string;
  }) {
    return await this.prisma.user.create({
      data: {
        email: input.email ?? null,
        phone: input.phone ?? null,
        passwordHash: input.passwordHash,
        refreshTokenHash: null,
        role: UserRole.Tourist as any,
      },
    });
  }

  async setRefreshTokenHash(userId: string, refreshTokenHash: string | null) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash },
    });
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: this.meSelect,
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async setSelectedCity(userId: string, cityId: string) {
    // Ensure city exists and isn't deleted
    const city = await this.prisma.city.findFirst({
      where: { id: cityId, deletedAt: null },
      select: { id: true },
    });
    if (!city) throw new BadRequestException('cityId must reference an existing city');

    await this.prisma.user.update({
      where: { id: userId },
      data: { selectedCityId: cityId },
    });

    return await this.getMe(userId);
  }
}


