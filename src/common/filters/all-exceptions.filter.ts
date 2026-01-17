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

    const isHttpException = exception instanceof HttpException;
    const statusCode = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const messageAndErrors = this.extractMessageAndErrors(exception);
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


