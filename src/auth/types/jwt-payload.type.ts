import type { UserRole } from '../../common/enums/user-role.enum';

export type JwtAccessTokenPayload = {
  sub: string;
  role: UserRole;
};


