// src/database/data-source.ts
import 'reflect-metadata';
import * as path from 'node:path';
import { DataSource } from 'typeorm';
import { config as loadEnv } from 'dotenv';

loadEnv();

const isProduction = process.env.NODE_ENV === 'production';

// Determine connection options
const dataSourceOptions = isProduction && process.env.DATABASE_URL
  ? {
      type: 'postgres' as const,
      url: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false, // required by Railway
      },
    }
  : {
      type: 'postgres' as const,
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 5432),
      username: process.env.DB_USERNAME ?? 'postgres',
      password: process.env.DB_PASSWORD ?? 'postgres',
      database: process.env.DB_NAME ?? 'betourist',
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    };

// Entities and migrations
const entitiesPath = isProduction
  ? path.join(__dirname, 'dist', '**', '*.entity.js')
  : path.join(__dirname, '**', '*.entity.ts');

const migrationsPath = isProduction
  ? path.join(__dirname, 'dist', 'database', 'migrations', '*.js')
  : path.join(__dirname, 'database', 'migrations', '*.ts');

export const AppDataSource = new DataSource({
  ...dataSourceOptions,
  synchronize: false, // never use true in production
  logging: !isProduction, // enable logs locally
  entities: [entitiesPath],
  migrations: [migrationsPath],
});
