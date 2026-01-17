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
    const message =
      statusCode === HttpStatus.INTERNAL_SERVER_ERROR
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


