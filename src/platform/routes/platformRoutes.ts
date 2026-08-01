import { NextFunction, Request, Response, Router } from 'express';
import { PlatformService } from '../services/platformService';

const asyncHandler =
  (handler: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    void handler(req, res, next).catch(next);
  };

const parseRecord = (value: unknown, fieldName: string): Record<string, unknown> | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== 'object' || Array.isArray(value)) {
    const error = new Error(`${fieldName} must be an object.`) as Error & {
      status: number;
      code: string;
    };
    error.status = 400;
    error.code = 'INVALID_REQUEST_BODY';
    throw error;
  }

  return value as Record<string, unknown>;
};

export const createPlatformRouter = (service = new PlatformService()): Router => {
  const router = Router();

  router.get('/runtime-templates', (req: Request, res: Response) => {
    res.json({ templates: service.listRuntimeTemplates() });
  });

  router.get(
    '/workloads',
    asyncHandler(async (req: Request, res: Response) => {
      const ownerId = typeof req.query.ownerId === 'string' ? req.query.ownerId : undefined;
      const workloads = await service.listWorkloads(ownerId);
      res.json({ workloads });
    })
  );

  router.post(
    '/workloads',
    asyncHandler(async (req: Request, res: Response) => {
      const workload = await service.createWorkload({
        ownerId: req.body.ownerId,
        name: req.body.name,
        description: req.body.description,
        template: req.body.template,
        desiredImage: req.body.desiredImage,
        config: parseRecord(req.body.config, 'config'),
        networkExposed: req.body.networkExposed,
        resourcePolicy: parseRecord(req.body.resourcePolicy, 'resourcePolicy'),
      });

      res.status(201).json({ workload });
    })
  );

  router.get(
    '/workloads/:workloadId',
    asyncHandler(async (req: Request, res: Response) => {
      const ownerId = typeof req.query.ownerId === 'string' ? req.query.ownerId : undefined;
      const workload = await service.getWorkload(req.params.workloadId, ownerId);
      res.json({ workload });
    })
  );

  router.post(
    '/workloads/:workloadId/runtimes',
    asyncHandler(async (req: Request, res: Response) => {
      const runtime = await service.launchRuntime(req.params.workloadId, {
        ownerId: req.body.ownerId,
        requestedBy: req.body.requestedBy,
        reason: req.body.reason,
        launchConfig: parseRecord(req.body.launchConfig, 'launchConfig'),
      });

      res.status(201).json({ runtime });
    })
  );

  router.get(
    '/runtimes',
    asyncHandler(async (req: Request, res: Response) => {
      const ownerId = typeof req.query.ownerId === 'string' ? req.query.ownerId : undefined;
      const runtimes = await service.listRuntimes(ownerId);
      res.json({ runtimes });
    })
  );

  router.get(
    '/runtimes/:runtimeId',
    asyncHandler(async (req: Request, res: Response) => {
      const ownerId = typeof req.query.ownerId === 'string' ? req.query.ownerId : undefined;
      const runtime = await service.getRuntime(req.params.runtimeId, ownerId);
      res.json({ runtime });
    })
  );

  router.get(
    '/runtimes/:runtimeId/history',
    asyncHandler(async (req: Request, res: Response) => {
      const ownerId = typeof req.query.ownerId === 'string' ? req.query.ownerId : undefined;
      const history = await service.listRuntimeHistory(req.params.runtimeId, ownerId);
      res.json({ history });
    })
  );

  router.get(
    '/runtimes/:runtimeId/logs',
    asyncHandler(async (req: Request, res: Response) => {
      const ownerId = typeof req.query.ownerId === 'string' ? req.query.ownerId : undefined;
      const logs = await service.listRuntimeLogs(req.params.runtimeId, ownerId);
      res.json({ logs });
    })
  );

  router.post(
    '/runtimes/:runtimeId/stop',
    asyncHandler(async (req: Request, res: Response) => {
      const ownerId = typeof req.body.ownerId === 'string' ? req.body.ownerId : undefined;
      const runtime = await service.stopRuntime(
        req.params.runtimeId,
        {
          requestedBy: req.body.requestedBy,
          reason: req.body.reason,
        },
        ownerId
      );

      res.json({ runtime });
    })
  );

  router.delete(
    '/runtimes/:runtimeId',
    asyncHandler(async (req: Request, res: Response) => {
      const ownerId = typeof req.body.ownerId === 'string' ? req.body.ownerId : undefined;
      const runtime = await service.deleteRuntime(
        req.params.runtimeId,
        req.body.requestedBy,
        ownerId
      );
      res.json({ runtime });
    })
  );

  return router;
};
