import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtAccessTokenPayload } from '../types/jwt-payload.type';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>(
        'JWT_ACCESS_SECRET',
        'dev-only-secret',
      ),
    });
  }

  async validate(payload: JwtAccessTokenPayload) {
    const status = await this.usersService.getAuthStatusById(payload.sub);
    if (!status || status.deletedAt) {
      throw new UnauthorizedException();
    }

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

    // Trust DB for role in case role changed after token issuance.
    return { id: status.id, role: status.role };
  }
}


