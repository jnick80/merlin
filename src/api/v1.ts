import { Router, Request, Response } from 'express';
import { platformProfile } from '../config/platformProfile';

export const v1Router = Router();

v1Router.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'D0!TY0UR3$3LF API',
    version: 'v1',
    status: 'ok',
    description: platformProfile.description
  });
});

v1Router.get('/platform-profile', (req: Request, res: Response) => {
  res.json(platformProfile);
});
