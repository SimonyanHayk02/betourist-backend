import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { UserRole } from '../../../common/enums/user-role.enum';

export class UpdateUserRoleDto {
  @ApiProperty({
    enum: UserRole,
    example: UserRole.PlatformAdmin,
  })
  @IsEnum(UserRole, { message: 'role must be a valid UserRole' })
  role!: UserRole;
}
