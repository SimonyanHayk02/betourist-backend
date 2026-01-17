import 'reflect-metadata';
import * as path from 'node:path';
import { DataSource } from 'typeorm';
import { config as loadEnv } from 'dotenv';

loadEnv();

const isProduction = process.env.NODE_ENV === 'production';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'betourist',
  ssl:
    isProduction || process.env.DB_SSL === 'true'
      ? { rejectUnauthorized: false }
      : false,
  entities: [
    isProduction
      ? path.join(__dirname, 'dist', '**', '*.entity.js')
      : path.join(__dirname, 'src', '**', '*.entity.ts'),
  ],
  migrations: [
    isProduction
      ? path.join(__dirname, 'dist', 'database', 'migrations', '*.js')
      : path.join(__dirname, 'src', 'database', 'migrations', '*.ts'),
  ],
});


