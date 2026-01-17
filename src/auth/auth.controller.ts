import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from '../users/dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshAuthGuard } from './guards/jwt-refresh-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Register a new tourist user (email or phone)' })
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return await this.authService.register(dto);
  }

  @ApiOperation({ summary: 'Login (email or phone)' })
  @Post('login')
  async login(@Body() dto: LoginDto) {
    return await this.authService.login(dto);
  }

  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @UseGuards(JwtRefreshAuthGuard)
  @Post('refresh')
  async refresh(@Request() req: any, @Body() dto: RefreshTokenDto) {
    return await this.authService.refresh(req.user.id, dto.refreshToken);
  }

  @ApiOperation({ summary: 'Logout (invalidate refresh token)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Request() req: any) {
    await this.authService.logout(req.user.id);
    return { success: true };
  }
}


