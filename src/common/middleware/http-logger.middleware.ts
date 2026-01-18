import { Logger } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

const logger = new Logger('HTTP');

export function httpLoggerMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const ms = Number(end - start) / 1_000_000;

    const requestId = req.requestId ?? req.header('x-request-id');
    const userId = (req.user as any)?.id;

    const line = [
      req.method,
      req.originalUrl || req.url,
      res.statusCode,
      `${ms.toFixed(1)}ms`,
      requestId ? `rid=${requestId}` : undefined,
      userId ? `uid=${userId}` : undefined,
    ]
      .filter(Boolean)
      .join(' ');

    if (res.statusCode >= 500) logger.error(line);
    else if (res.statusCode >= 400) logger.warn(line);
    else logger.log(line);
  });

  next();
}


