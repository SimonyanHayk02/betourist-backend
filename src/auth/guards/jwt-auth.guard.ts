import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly usersService: UsersService) {
    super();
  }

  handleRequest(err: any, user: any) {
    if (err || !user) {
      throw err ?? new UnauthorizedException();
    }

    return user;
  }

  async canActivate(context: any) {
    const can = (await super.canActivate(context)) as boolean;
    if (!can) return false;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user?.id) throw new UnauthorizedException();

    const status = await this.usersService.getAuthStatusById(user.id);
    if (!status || status.deletedAt) throw new UnauthorizedException();

    if (status.isActive === false) {
      throw new ForbiddenException('User is inactive');
    }

    if (status.isSuspended === true) {
      if (!status.suspendedUntil) {
        throw new ForbiddenException('User is suspended');
      }
      const until = new Date(status.suspendedUntil);
      if (Number.isFinite(until.getTime()) && until.getTime() > Date.now()) {
        throw new ForbiddenException('User is suspended');
      }
    }

    return true;
  }
}


