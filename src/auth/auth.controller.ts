import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from '../users/dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshAuthGuard } from './guards/jwt-refresh-auth.guard';

type RequestWithUser = ExpressRequest & { user: { id: string } };

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Register a new tourist user (email or phone)' })
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
  ): ReturnType<AuthService['register']> {
    return await this.authService.register(dto);
  }

  @ApiOperation({ summary: 'Login (email or phone)' })
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Post('login')
  async login(@Body() dto: LoginDto): ReturnType<AuthService['login']> {
    return await this.authService.login(dto);
  }

  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @UseGuards(JwtRefreshAuthGuard)
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  @Post('refresh')
  async refresh(
    @Request() req: RequestWithUser,
    @Body() dto: RefreshTokenDto,
  ): ReturnType<AuthService['refresh']> {
    return await this.authService.refresh(req.user.id, dto.refreshToken);
  }

  @ApiOperation({ summary: 'Logout (invalidate refresh token)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  @Post('logout')
  async logout(@Request() req: RequestWithUser): Promise<{ success: true }> {
    await this.authService.logout(req.user.id);
    return { success: true };
  }
}
