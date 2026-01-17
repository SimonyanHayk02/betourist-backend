import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { UsersService } from '../users/users.service';
import { RegisterDto } from '../users/dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthTokens } from './types/auth-tokens.type';
import { UserRole } from '../common/enums/user-role.enum';
import type { StringValue } from 'ms';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthTokens> {
    if (!dto.email && !dto.phone) {
      throw new BadRequestException('Either email or phone is required');
    }

    if (dto.email) {
      const existing = await this.usersService.findByEmail(dto.email);
      if (existing) throw new BadRequestException('Email already in use');
    }
    if (dto.phone) {
      const existing = await this.usersService.findByPhone(dto.phone);
      if (existing) throw new BadRequestException('Phone already in use');
    }

    const passwordHash = await argon2.hash(dto.password);
    const user = await this.usersService.createTouristUser({
      email: dto.email,
      phone: dto.phone,
      passwordHash,
    });

    const tokens = await this.issueTokens({
      userId: user.id,
      role: user.role as unknown as UserRole,
    });
    await this.storeRefreshTokenHash(user.id, tokens.refreshToken);
    return tokens;
  }

  async login(dto: LoginDto): Promise<AuthTokens> {
    if (!dto.email && !dto.phone) {
      throw new BadRequestException('Either email or phone is required');
    }

    const user = dto.email
      ? await this.usersService.findByEmail(dto.email)
      : await this.usersService.findByPhone(dto.phone!);

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const ok = await argon2.verify(user.passwordHash, dto.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const tokens = await this.issueTokens({
      userId: user.id,
      role: user.role as unknown as UserRole,
    });
    await this.storeRefreshTokenHash(user.id, tokens.refreshToken);
    return tokens;
  }

  async refresh(userId: string, refreshToken: string): Promise<AuthTokens> {
    const user = await this.usersService.findById(userId);
    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const ok = await argon2.verify(user.refreshTokenHash, refreshToken);
    if (!ok) throw new UnauthorizedException('Invalid refresh token');

    const tokens = await this.issueTokens({
      userId: user.id,
      role: user.role as unknown as UserRole,
    });
    await this.storeRefreshTokenHash(user.id, tokens.refreshToken);
    return tokens;
  }

  async logout(userId: string): Promise<void> {
    await this.usersService.setRefreshTokenHash(userId, null);
  }

  private async issueTokens(input: {
    userId: string;
    role: UserRole;
  }): Promise<AuthTokens> {
    const accessSecret = this.configService.get<string>(
      'JWT_ACCESS_SECRET',
      'dev-only-secret',
    );
    const accessExpiresIn = this.configService.get<string>(
      'JWT_ACCESS_EXPIRES_IN',
      '15m',
    ) as unknown as StringValue;

    const refreshSecret = this.configService.get<string>(
      'JWT_REFRESH_SECRET',
      'dev-only-refresh-secret',
    );
    const refreshExpiresIn = this.configService.get<string>(
      'JWT_REFRESH_EXPIRES_IN',
      '30d',
    ) as unknown as StringValue;

    const payload = { sub: input.userId, role: input.role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: accessSecret,
        expiresIn: accessExpiresIn,
      }),
      this.jwtService.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: refreshExpiresIn,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async storeRefreshTokenHash(userId: string, refreshToken: string) {
    const refreshTokenHash = await argon2.hash(refreshToken);
    await this.usersService.setRefreshTokenHash(userId, refreshTokenHash);
  }
}


