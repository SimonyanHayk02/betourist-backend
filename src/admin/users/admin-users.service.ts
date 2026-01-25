import { Injectable } from '@nestjs/common';
import { DbUserRole, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ListUsersQueryDto } from './dto/list-users.query.dto';
import { UserRole } from '../../common/enums/user-role.enum';

type AdminUserListItem = Prisma.UserGetPayload<{
  select: {
    id: true;
    createdAt: true;
    updatedAt: true;
    email: true;
    phone: true;
    role: true;
    verificationStatus: true;
    isActive: true;
    isSuspended: true;
    suspendedUntil: true;
    selectedCityId: true;
  };
}>;

@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListUsersQueryDto): Promise<{
    page: number;
    limit: number;
    total: number;
    items: AdminUserListItem[];
  }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(query.q
        ? {
            OR: [
              { email: { contains: query.q, mode: 'insensitive' as const } },
              { phone: { contains: query.q, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const select = {
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
    } as const;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { page, limit, total, items };
  }

  async updateRole(
    userId: string,
    role: UserRole,
  ): Promise<
    Prisma.UserGetPayload<{
      select: {
        id: true;
        email: true;
        phone: true;
        role: true;
        updatedAt: true;
      };
    }>
  > {
    return await this.prisma.user.update({
      where: { id: userId },
      data: { role: role as DbUserRole },
      select: {
        id: true,
        email: true,
        phone: true,
        role: true,
        updatedAt: true,
      },
    });
  }

  async suspend(
    userId: string,
    suspendedUntil?: string,
  ): Promise<
    Prisma.UserGetPayload<{
      select: {
        id: true;
        email: true;
        phone: true;
        isSuspended: true;
        suspendedUntil: true;
        updatedAt: true;
      };
    }>
  > {
    return await this.prisma.user.update({
      where: { id: userId },
      data: {
        isSuspended: true,
        suspendedUntil: suspendedUntil ? new Date(suspendedUntil) : null,
      },
      select: {
        id: true,
        email: true,
        phone: true,
        isSuspended: true,
        suspendedUntil: true,
        updatedAt: true,
      },
    });
  }

  async unsuspend(userId: string): Promise<
    Prisma.UserGetPayload<{
      select: {
        id: true;
        email: true;
        phone: true;
        isSuspended: true;
        suspendedUntil: true;
        updatedAt: true;
      };
    }>
  > {
    return await this.prisma.user.update({
      where: { id: userId },
      data: {
        isSuspended: false,
        suspendedUntil: null,
      },
      select: {
        id: true,
        email: true,
        phone: true,
        isSuspended: true,
        suspendedUntil: true,
        updatedAt: true,
      },
    });
  }
}
