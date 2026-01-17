import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { HttpAdapterHost } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { API_DEFAULT_VERSION, API_PREFIX } from './common/constants/api.constants';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') ?? 3000;
  const baseUrl = configService.get<string>('BASE_URL');
  const swaggerEnabled =
    (configService.get<string>('SWAGGER_ENABLED') ?? '').toLowerCase() ===
      'true' || configService.get('NODE_ENV') !== 'production';

  app.setGlobalPrefix(API_PREFIX);
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: API_DEFAULT_VERSION,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const httpAdapterHost = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapterHost));

  if (swaggerEnabled) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('BeTourist API')
      .setDescription('BeTourist backend API (v1)')
      .setVersion('1.0')
      .addBearerAuth()
      // Add both variants to handle Nest URI versioning differences in generated paths.
      .addServer(baseUrl ?? `http://localhost:${port}`)
      .addServer(`${(baseUrl ?? `http://localhost:${port}`)}/${API_PREFIX}/v${API_DEFAULT_VERSION}`)
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document, { useGlobalPrefix: true });
  }

  await app.listen(port);
}
bootstrap();
