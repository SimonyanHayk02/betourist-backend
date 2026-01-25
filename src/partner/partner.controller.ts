import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PartnerService } from './partner.service';
import { CreatePartnerProfileDto } from './dto/create-partner-profile.dto';

@ApiTags('partner')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.Partner)
@Controller('partner')
export class PartnerController {
  constructor(private readonly partnerService: PartnerService) {}

  @ApiOperation({ summary: 'Get my partner profile (partner-only)' })
  @Get('profile')
  async getProfile(
    @CurrentUser('id') userId: string,
  ): ReturnType<PartnerService['getOwnedPartner']> {
    return await this.partnerService.getOwnedPartner(userId);
  }

  @ApiOperation({ summary: 'Create my partner profile (partner-only)' })
  @Post('profile')
  async createProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: CreatePartnerProfileDto,
  ): ReturnType<PartnerService['createOwnedPartner']> {
    return await this.partnerService.createOwnedPartner(userId, dto.name);
  }
}
