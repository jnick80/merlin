import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { Database } from './database/connection';
import { v1Metadata, v1Router } from './api/v1';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;
const requestBodyLimit = process.env.REQUEST_BODY_LIMIT || '100kb';
const allowedOrigins = new Set(
  (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
);

app.disable('x-powered-by');
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (origin && allowedOrigins.has(origin)) {
        callback(null, origin);
        return;
      }

      callback(null, false);
    }
  })
);
app.use(express.json({ limit: requestBodyLimit }));
app.use(express.urlencoded({ extended: true, limit: requestBodyLimit, parameterLimit: 100 }));
app.use(requestLogger);

app.get('/', (req: Request, res: Response) => {
  res.type('html').send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Merlin Business OS</title>
  </head>
  <body>
    <main>
      <h1>Merlin Business OS</h1>
      <p>GUI entry point for the Merlin API.</p>

      <section aria-labelledby="system-status">
        <h2 id="system-status">System status</h2>
        <ul>
          <li>API name: ${v1Metadata.name}</li>
          <li>API version: ${v1Metadata.version}</li>
          <li>API status: ${v1Metadata.status}</li>
        </ul>
      </section>

      <section aria-labelledby="available-endpoints">
        <h2 id="available-endpoints">Available endpoints</h2>
        <ul>
          <li><a href="/health">Health check</a></li>
          <li><a href="/api/v1">API metadata</a></li>
        </ul>
      </section>
    </main>
  </body>
</html>`);
});

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/v1', v1Router);

app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found', path: req.path });
});

app.use(errorHandler);

export const startServer = async (): Promise<void> => {
  try {
    const db = Database.getInstance();
    await db.connect();
    logger.info('Database connected successfully');
    app.listen(PORT, () => {
      logger.info(`Merlin Business OS running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

if (require.main === module) {
  void startServer();
}

export default app;
