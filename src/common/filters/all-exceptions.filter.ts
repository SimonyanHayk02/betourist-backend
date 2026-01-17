import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request } from 'express';
import { HttpAdapterHost } from '@nestjs/core';

type ErrorResponseBody = {
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  message: string;
  errors?: string[];
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse();

    const timestamp = new Date().toISOString();
    const path = request.url;
    const method = request.method;

    const prismaError = this.extractPrismaError(exception);
    const isHttpException = exception instanceof HttpException;
    const statusCode =
      prismaError?.statusCode ??
      (isHttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR);

    const messageAndErrors =
      prismaError ?? this.extractMessageAndErrors(exception);
    // If we have a Prisma-derived message, it's already sanitized and safe to show,
    // even when it's a 500 (e.g. schema not up to date).
    const message =
      !prismaError && statusCode === HttpStatus.INTERNAL_SERVER_ERROR
        ? 'Internal server error'
        : messageAndErrors.message;

    const body: ErrorResponseBody = {
      statusCode,
      timestamp,
      path,
      method,
      message,
      ...(messageAndErrors.errors?.length
        ? { errors: messageAndErrors.errors }
        : {}),
    };

    if (statusCode >= 500) {
      const err = exception as any;
      this.logger.error(
        `${method} ${path} -> ${statusCode}`,
        err?.stack ?? String(exception),
      );
    }

    httpAdapter.reply(response, body, statusCode);
  }

  private extractPrismaError(exception: unknown): {
    statusCode: number;
    message: string;
    errors?: string[];
  } | null {
    // Avoid importing Prisma types here; check shape defensively.
    const e = exception as any;
    if (!e || typeof e !== 'object') return null;
    if (e?.name !== 'PrismaClientKnownRequestError') return null;

    const code: string | undefined = e?.code;
    // Always log Prisma error codes (helps production debugging; response stays sanitized).
    this.logger.warn(
      `Prisma error ${code ?? 'unknown'}: ${String(e?.message ?? '')}`,
    );
    // https://www.prisma.io/docs/orm/reference/error-reference
    if (code === 'P2002') {
      const target = Array.isArray(e?.meta?.target) ? e.meta.target : [];
      return {
        statusCode: HttpStatus.CONFLICT,
        message: 'Unique constraint violation',
        ...(target.length ? { errors: target.map((t: string) => `${t} must be unique`) } : {}),
      };
    }

    if (code === 'P2025') {
      return { statusCode: HttpStatus.NOT_FOUND, message: 'Resource not found' };
    }

    // Raw query failures (Prisma wraps DB errors as P2010)
    if (code === 'P2010') {
      const msg = String(e?.message ?? '');
      // Postgres foreign key violation (e.g. city.countryId references missing country)
      if (msg.includes('Code: `23503`')) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Foreign key constraint failed',
          errors: ['countryId must reference an existing country'],
        };
      }
      return { statusCode: HttpStatus.BAD_REQUEST, message: 'Database request failed' };
    }

    // Schema / table issues (treat as server misconfiguration)
    if (code === 'P2021' || code === 'P2022') {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Database schema is not up to date',
      };
    }

    return { statusCode: HttpStatus.BAD_REQUEST, message: 'Database request failed' };
  }

  private extractMessageAndErrors(exception: unknown): {
    message: string;
    errors?: string[];
  } {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();

      if (typeof response === 'string') {
        return { message: response };
      }

      if (response && typeof response === 'object') {
        const r = response as any;

        const messageValue = r?.message;
        if (Array.isArray(messageValue)) {
          return { message: 'Validation failed', errors: messageValue };
        }
        if (typeof messageValue === 'string') {
          return { message: messageValue };
        }

        return { message: exception.message };
      }

      return { message: exception.message };
    }

    if (exception instanceof Error) {
      return { message: exception.message || 'Internal server error' };
    }

    return { message: 'Internal server error' };
  }
}


