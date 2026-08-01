import { Router, Request, Response } from 'express';

export const v1Router = Router();
export const v1Metadata = {
  name: 'Merlin Business OS API',
  version: 'v1',
  status: 'ok'
};

v1Router.get('/', (req: Request, res: Response) => {
  res.json(v1Metadata);
});
