import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { Database } from './database/connection';
import { v1Router } from './api/v1';

dotenv.config();

const PORT = process.env.PORT || 3000;

export const createApp = (): Express => {
  const app: Express = express();

  app.use(helmet());
  app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(requestLogger);

  app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/api/v1', v1Router);

  app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Not Found', path: req.path });
  });

  app.use(errorHandler);

  return app;
};

const startServer = async (): Promise<void> => {
  try {
    const db = Database.getInstance();
    await db.connect();
    logger.info('Database connected successfully');
    const app = createApp();
    app.listen(PORT, () => {
      logger.info(`Merlin Business OS running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  void startServer();
}

export default createApp();
