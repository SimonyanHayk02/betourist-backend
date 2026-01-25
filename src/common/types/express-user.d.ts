import type { UserRole } from '../enums/user-role.enum';

declare global {
  namespace Express {
    interface User {
      id: string;
      role: UserRole;
    }
  }
}

export {};
