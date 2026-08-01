import { Router, Request, Response } from 'express';
import { createPlatformRouter } from '../platform/routes/platformRoutes';

export const v1Router = Router();

v1Router.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'Merlin Business OS API',
    version: 'v1',
    status: 'ok',
    capabilities: ['platform-control-plane', 'workload-definitions', 'runtime-lifecycle'],
  });
});

v1Router.use('/platform', createPlatformRouter());
