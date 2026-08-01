import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';
import { createSectionLogger } from '../utils/logger';

const requestLoggerInstance = createSectionLogger('request');

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  const incomingRequestId = req.header('x-request-id');
  const requestId =
    incomingRequestId && incomingRequestId.trim() ? incomingRequestId : randomUUID();

  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);

  res.on('finish', () => {
    const duration = Date.now() - start;
    requestLoggerInstance.http('Request completed', {
      requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: duration,
      ip: req.ip,
    });
  });

  next();
};
