import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { CountriesModule } from './countries/countries.module';
import { CitiesModule } from './cities/cities.module';
import { PlacesModule } from './places/places.module';
import { CategoriesModule } from './categories/categories.module';
import { HealthModule } from './health/health.module';
import { AdminUsersModule } from './admin/users/admin-users.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const ttlSeconds = Number(
          configService.get<string>('THROTTLE_TTL_SECONDS') ?? '60',
        );
        const limit = Number(configService.get<string>('THROTTLE_LIMIT') ?? '120');

        return [{ ttl: ttlSeconds * 1000, limit }];
      },
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    CountriesModule,
    CitiesModule,
    CategoriesModule,
    PlacesModule,
    HealthModule,
    AdminUsersModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
