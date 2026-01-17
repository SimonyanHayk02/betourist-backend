import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import type { TypeOrmModuleOptions } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions => {
        const isProduction = configService.get('NODE_ENV') === 'production';
        const databaseUrl = configService.get<string>('DATABASE_URL');

        const base: TypeOrmModuleOptions = {
          type: 'postgres',
          autoLoadEntities: true,
          synchronize: false,
          migrationsRun: false,
          ssl: isProduction
            ? { rejectUnauthorized: false }
            : (configService.get<string>('DB_SSL') === 'true' ? { rejectUnauthorized: false } : false),
        };

        if (databaseUrl) {
          return { ...base, url: databaseUrl };
        }

        return {
          ...base,
          host: configService.get<string>('DB_HOST', 'localhost'),
          port: configService.get<number>('DB_PORT', 5432),
          username: configService.get<string>('DB_USERNAME', 'postgres'),
          password: configService.get<string>('DB_PASSWORD', 'postgres'),
          database: configService.get<string>('DB_NAME', 'betourist'),
        };
      },
    }),
  ],
})
export class DatabaseModule {}


