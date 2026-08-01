import cors from 'cors';
import express, { Express, Request, Response } from 'express';
import helmet from 'helmet';
import { v1Router } from './api/v1';
import { env, allowedOrigins } from './config/env';
import { Database } from './database/connection';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { createSectionLogger } from './utils/logger';

const startupLogger = createSectionLogger('startup');
const appLogger = createSectionLogger('app');

export const createApp = (): Express => {
  const app: Express = express();

  appLogger.info('Configuring Express application', {
    apiVersion: env.API_VERSION,
    corsOrigins: allowedOrigins,
    executor: env.PLATFORM_EXECUTOR,
  });

  app.use(helmet());
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error('Origin not allowed by CORS policy.'));
      },
    })
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(requestLogger);

  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: env.APP_NAME,
      version: env.API_VERSION,
      executor: env.PLATFORM_EXECUTOR,
      timestamp: new Date().toISOString(),
    });
  });

  app.use(`/api/${env.API_VERSION}`, v1Router);

  app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Not Found', path: req.path, requestId: req.requestId });
  });

  app.use(errorHandler);

  return app;
};

const startServer = async (): Promise<void> => {
  try {
    startupLogger.info('Starting service', {
      nodeEnv: env.NODE_ENV,
      port: env.PORT,
      executor: env.PLATFORM_EXECUTOR,
    });

    const db = Database.getInstance();
    await db.connect();
    startupLogger.info('Database connected successfully', {
      host: env.DB_HOST,
      database: env.DB_NAME,
      port: env.DB_PORT,
    });

    const app = createApp();
    app.listen(env.PORT, () => {
      startupLogger.info('Service listening', {
        port: env.PORT,
        apiBaseUrl: env.API_BASE_URL,
        apiVersion: env.API_VERSION,
      });
    });
  } catch (error) {
    startupLogger.error('Failed to start service', { error });
    process.exit(1);
  }
};

if (require.main === module) {
  void startServer();
}

export default createApp();
