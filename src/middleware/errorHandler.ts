import { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';
import { createSectionLogger } from '../utils/logger';

const errorLogger = createSectionLogger('error');

export interface AppError extends Error {
  status?: number;
  code?: string;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  void next;
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  errorLogger.error('Request failed', {
    requestId: req.requestId,
    statusCode: status,
    errorCode: err.code,
    method: req.method,
    path: req.originalUrl,
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack,
    },
  });

  res.status(status).json({
    error: {
      status,
      message,
      code: err.code,
      requestId: req.requestId,
      ...(env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
};
