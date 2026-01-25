import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { AdminUsersService } from './admin-users.service';
import { ListUsersQueryDto } from './dto/list-users.query.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { SuspendUserDto } from './dto/suspend-user.dto';

@ApiTags('admin.users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @ApiOperation({ summary: 'List users (admin-only)' })
  @Roles(UserRole.PlatformAdmin, UserRole.SuperAdmin)
  @Get()
  async list(@Query() query: ListUsersQueryDto) {
    return await this.adminUsersService.list(query);
  }

  @ApiOperation({ summary: 'Update user role (super-admin only)' })
  @Roles(UserRole.SuperAdmin)
  @Patch(':id/role')
  async updateRole(@Param('id') id: string, @Body() dto: UpdateUserRoleDto) {
    return await this.adminUsersService.updateRole(id, dto.role);
  }

  @ApiOperation({ summary: 'Suspend user (admin-only)' })
  @Roles(UserRole.PlatformAdmin, UserRole.SuperAdmin)
  @Patch(':id/suspend')
  async suspend(@Param('id') id: string, @Body() dto: SuspendUserDto) {
    return await this.adminUsersService.suspend(id, dto.suspendedUntil);
  }

  @ApiOperation({ summary: 'Unsuspend user (admin-only)' })
  @Roles(UserRole.PlatformAdmin, UserRole.SuperAdmin)
  @Patch(':id/unsuspend')
  async unsuspend(@Param('id') id: string) {
    return await this.adminUsersService.unsuspend(id);
  }
}
