import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ListUsersQueryDto } from './dto/list-users.query.dto';
import { UserRole } from '../../common/enums/user-role.enum';

@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListUsersQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = {
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

    const [items, total] = await Promise.all([
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

  async updateRole(userId: string, role: UserRole) {
    return await this.prisma.user.update({
      where: { id: userId },
      data: { role: role as any },
      select: {
        id: true,
        email: true,
        phone: true,
        role: true,
        updatedAt: true,
      },
    });
  }
}


