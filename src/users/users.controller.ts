import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { SetSelectedCityDto } from './dto/set-selected-city.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Get current user profile (includes selected city)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser('id') userId: string) {
    return await this.usersService.getMe(userId);
  }

  @ApiOperation({ summary: 'Set selected city during onboarding' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('me/onboarding')
  async setSelectedCity(
    @CurrentUser('id') userId: string,
    @Body() dto: SetSelectedCityDto,
  ) {
    return await this.usersService.setSelectedCity(userId, dto.cityId);
  }
}


