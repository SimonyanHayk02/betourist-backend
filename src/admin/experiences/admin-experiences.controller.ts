import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { AdminExperiencesService } from './admin-experiences.service';
import { ListPendingExperiencesQueryDto } from './dto/list-pending-experiences.query.dto';
import { RejectExperienceDto } from './dto/reject-experience.dto';

@ApiTags('admin.experiences')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PlatformAdmin, UserRole.SuperAdmin)
@Controller('admin/experiences')
export class AdminExperiencesController {
  constructor(private readonly adminExperiencesService: AdminExperiencesService) {}

  @ApiOperation({ summary: 'List experiences pending review (admin-only)' })
  @Get('pending')
  async listPending(@Query() query: ListPendingExperiencesQueryDto) {
    return await this.adminExperiencesService.listPending(query);
  }

  @ApiOperation({ summary: 'Approve an experience (admin-only)' })
  @Post(':id/approve')
  async approve(@Param('id') id: string) {
    return await this.adminExperiencesService.approve(id);
  }

  @ApiOperation({ summary: 'Reject an experience (admin-only)' })
  @Post(':id/reject')
  async reject(@Param('id') id: string, @Body() dto: RejectExperienceDto) {
    return await this.adminExperiencesService.reject(id, dto.rejectionReason);
  }
}


