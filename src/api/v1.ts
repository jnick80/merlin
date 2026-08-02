import { Router, Request, Response } from 'express';
import {
  createCatalogRouter,
  createDiagnosticsRouter,
  createTractorRouter,
} from '../diagnostics/routes/diagnosticRoutes';
import { createPlatformRouter } from '../platform/routes/platformRoutes';

export const v1Router = Router();

v1Router.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'Merlin Tractor Diagnostics API',
    version: 'v1',
    status: 'ok',
    localFirst: true,
    noDomainRequired: true,
    capabilities: [
      'tractor-code-lookup',
      'model-aware-guidance',
      'symptom-search',
      'local-catalog-admin',
    ],
    routes: {
      tractors: '/api/v1/tractors',
      diagnostics: '/api/v1/diagnostics',
      catalog: '/api/v1/catalog',
    },
  });
});

v1Router.use('/tractors', createTractorRouter());
v1Router.use('/diagnostics', createDiagnosticsRouter());
v1Router.use('/catalog', createCatalogRouter());
v1Router.use('/platform', createPlatformRouter());
