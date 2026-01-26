import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { HttpAdapterHost } from '@nestjs/core';

type ErrorResponseBody = {
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  requestId?: string;
  message: string;
  errors?: string[];
};

type RequestWithId = Request & { requestId?: string };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<RequestWithId>();
    const response = ctx.getResponse<Response>();

    const timestamp = new Date().toISOString();
    const path = request.url;
    const method = request.method;
    const requestId =
      request.requestId ??
      (typeof request.header === 'function'
        ? request.header('x-request-id')
        : undefined);

    const prismaError = this.extractPrismaError(exception);
    const isHttpException = exception instanceof HttpException;
    const statusCode =
      prismaError?.statusCode ??
      (isHttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR);

    const messageAndErrors =
      prismaError ?? this.extractMessageAndErrors(exception);
    // If we have a Prisma-derived message, it's already sanitized and safe to show,
    // even when it's a 500 (e.g. schema not up to date).
    const message =
      !prismaError && statusCode === Number(HttpStatus.INTERNAL_SERVER_ERROR)
        ? 'Internal server error'
        : messageAndErrors.message;

    const body: ErrorResponseBody = {
      statusCode,
      timestamp,
      path,
      method,
      ...(requestId ? { requestId } : {}),
      message,
      ...(messageAndErrors.errors?.length
        ? { errors: messageAndErrors.errors }
        : {}),
    };

    if (statusCode >= 500) {
      const err = exception instanceof Error ? exception : undefined;
      this.logger.error(
        `${method} ${path} -> ${statusCode}${requestId ? ` rid=${requestId}` : ''}`,
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
    if (!isRecord(exception)) return null;
    const prismaName =
      typeof exception.name === 'string' ? exception.name : undefined;
    if (!prismaName || typeof prismaName !== 'string') return null;
    if (!prismaName.startsWith('PrismaClient')) return null;

    const code =
      typeof exception.code === 'string' ? exception.code : undefined;
    // Always log Prisma error name/code (helps production debugging; response stays sanitized).
    const exceptionMessage =
      typeof exception.message === 'string' ? exception.message : '';
    this.logger.warn(
      `Prisma error ${prismaName}${code ? ` ${code}` : ''}: ${exceptionMessage}`,
    );

    if (prismaName === 'PrismaClientValidationError') {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Invalid database request',
      };
    }

    if (prismaName !== 'PrismaClientKnownRequestError') {
      // Unknown Prisma errors => treat as server error (but keep message sanitized)
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Database error',
      };
    }
    // https://www.prisma.io/docs/orm/reference/error-reference
    if (code === 'P2002') {
      const metaTarget = isRecord(exception.meta)
        ? exception.meta.target
        : undefined;
      const target = Array.isArray(metaTarget) ? metaTarget : [];
      return {
        statusCode: HttpStatus.CONFLICT,
        message: 'Unique constraint violation',
        ...(target.length
          ? { errors: target.map((t: string) => `${t} must be unique`) }
          : {}),
      };
    }

    if (code === 'P2025') {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Resource not found',
      };
    }

    // Foreign key constraint violation (P2003)
    if (code === 'P2003') {
      const msg = exceptionMessage;
      const errors: string[] = [];
      if (msg.includes('cityId') || msg.includes('places_cityId_fkey')) {
        errors.push('cityId must reference an existing city');
      }
      if (msg.includes('categoryId') || msg.includes('places_categoryId_fkey')) {
        errors.push('categoryId must reference an existing category');
      }
      if (msg.includes('countryId') || msg.includes('cities_countryId_fkey')) {
        errors.push('countryId must reference an existing country');
      }
      if (msg.includes('partnerId') || msg.includes('places_partnerId_fkey')) {
        errors.push('partnerId must reference an existing partner');
      }
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Foreign key constraint failed',
        errors: errors.length > 0 ? errors : ['Referenced resource does not exist'],
      };
    }

    // Raw query failures (Prisma wraps DB errors as P2010)
    if (code === 'P2010') {
      const msg = exceptionMessage;
      // Postgres foreign key violation (e.g. city.countryId references missing country)
      if (msg.includes('Code: `23503`')) {
        const errors: string[] = [];
        if (msg.includes('cityId') || msg.includes('places_cityId_fkey')) {
          errors.push('cityId must reference an existing city');
        }
        if (msg.includes('categoryId') || msg.includes('places_categoryId_fkey')) {
          errors.push('categoryId must reference an existing category');
        }
        if (msg.includes('countryId') || msg.includes('cities_countryId_fkey')) {
          errors.push('countryId must reference an existing country');
        }
        if (msg.includes('partnerId') || msg.includes('places_partnerId_fkey')) {
          errors.push('partnerId must reference an existing partner');
        }
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Foreign key constraint failed',
          errors: errors.length > 0 ? errors : ['Referenced resource does not exist'],
        };
      }
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Database request failed',
      };
    }

    // Schema / table issues (treat as server misconfiguration)
    if (code === 'P2021' || code === 'P2022') {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Database schema is not up to date',
      };
    }

    return {
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'Database request failed',
    };
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
        const r = response as Record<string, unknown>;
        const messageValue = r.message;
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
