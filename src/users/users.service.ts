import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DbUserRole, Prisma, User } from '@prisma/client';
import { UserRole } from '../common/enums/user-role.enum';
import { PrismaService } from '../prisma/prisma.service';

const authStatusSelect = {
  id: true,
  deletedAt: true,
  isActive: true,
  isSuspended: true,
  suspendedUntil: true,
  role: true,
} as const;

const meSelect = {
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
      country: {
        select: { id: true, name: true, isoCode2: true, isoCode3: true },
      },
    },
  },
} as const;

type AuthStatus = Prisma.UserGetPayload<{ select: typeof authStatusSelect }>;
type MeUser = Prisma.UserGetPayload<{ select: typeof meSelect }>;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    return await this.prisma.user.findUnique({ where: { email } });
  }

  async findByPhone(phone: string): Promise<User | null> {
    return await this.prisma.user.findUnique({ where: { phone } });
  }

  async findById(id: string): Promise<User | null> {
    return await this.prisma.user.findUnique({ where: { id } });
  }

  async getAuthStatusById(id: string): Promise<AuthStatus | null> {
    return await this.prisma.user.findUnique({
      where: { id },
      select: authStatusSelect,
    });
  }

  async createTouristUser(input: {
    email?: string;
    phone?: string;
    passwordHash: string;
  }): Promise<User> {
    return await this.prisma.user.create({
      data: {
        email: input.email ?? null,
        phone: input.phone ?? null,
        passwordHash: input.passwordHash,
        refreshTokenHash: null,
        role: UserRole.Tourist as DbUserRole,
      },
    });
  }

  async setRefreshTokenHash(userId: string, refreshTokenHash: string | null) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash },
    });
  }

  async getMe(userId: string): Promise<MeUser> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: meSelect,
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
    if (!city)
      throw new BadRequestException('cityId must reference an existing city');

    await this.prisma.user.update({
      where: { id: userId },
      data: { selectedCityId: cityId },
    });

    return await this.getMe(userId);
  }
}
