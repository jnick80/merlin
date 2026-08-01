import { Router, Request, Response } from 'express';

export const v1Router = Router();

v1Router.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'Merlin Business OS API',
    version: 'v1',
    status: 'ok'
  });
});
