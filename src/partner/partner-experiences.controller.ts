import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PartnerExperiencesService } from './partner-experiences.service';
import { CreatePartnerExperienceDto } from './dto/create-partner-experience.dto';
import { UpdatePartnerExperienceDto } from './dto/update-partner-experience.dto';
import { ListPartnerExperiencesQueryDto } from './dto/list-partner-experiences.query.dto';

@ApiTags('partner.experiences')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.Partner)
@Controller('partner/experiences')
export class PartnerExperiencesController {
  constructor(
    private readonly partnerExperiencesService: PartnerExperiencesService,
  ) {}

  @ApiOperation({ summary: 'List my experiences (partner-only)' })
  @Get()
  async list(
    @CurrentUser('id') userId: string,
    @Query() query: ListPartnerExperiencesQueryDto,
  ): ReturnType<PartnerExperiencesService['list']> {
    return await this.partnerExperiencesService.list(userId, query);
  }

  @ApiOperation({ summary: 'Create an experience (partner-only)' })
  @Post()
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreatePartnerExperienceDto,
  ): ReturnType<PartnerExperiencesService['create']> {
    return await this.partnerExperiencesService.create(userId, dto);
  }

  @ApiOperation({ summary: 'Update my experience (partner-only)' })
  @Patch(':id')
  async update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePartnerExperienceDto,
  ): ReturnType<PartnerExperiencesService['update']> {
    return await this.partnerExperiencesService.update(userId, id, dto);
  }

  @ApiOperation({ summary: 'Submit my experience for review (partner-only)' })
  @Post(':id/submit')
  async submit(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ): ReturnType<PartnerExperiencesService['submit']> {
    return await this.partnerExperiencesService.submit(userId, id);
  }
}
