import { NextFunction, Request, Response, Router } from 'express';
import { createAppError } from '../../platform/errors';
import { DiagnosticService } from '../services/diagnosticService';
import { DiagnosticCodeUpsertInput, GuidanceSeverity } from '../types';

const asyncHandler =
  (handler: (req: Request, res: Response, next: NextFunction) => Promise<void> | void) =>
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };

const parseStringArray = (value: unknown, fieldName: string): string[] => {
  if (value === undefined || value === null) {
    return [];
  }

  if (!Array.isArray(value) || value.some((entry) => typeof entry !== 'string')) {
    throw createAppError(400, `${fieldName} must be an array of strings.`, 'INVALID_REQUEST_BODY');
  }

  return value.map((entry) => entry.trim()).filter(Boolean);
};

const parseSeverity = (value: unknown): GuidanceSeverity => {
  if (
    value === 'maintenance' ||
    value === 'advisory' ||
    value === 'warning' ||
    value === 'critical'
  ) {
    return value;
  }

  throw createAppError(400, 'severity is invalid.', 'INVALID_REQUEST_BODY');
};

const parseDiagnosticCodePayload = (body: Record<string, unknown>): DiagnosticCodeUpsertInput => {
  if (typeof body.manufacturerId !== 'string' || !body.manufacturerId.trim()) {
    throw createAppError(400, 'manufacturerId is required.', 'INVALID_REQUEST_BODY');
  }

  if (typeof body.code !== 'string' || !body.code.trim()) {
    throw createAppError(400, 'code is required.', 'INVALID_REQUEST_BODY');
  }

  if (typeof body.title !== 'string' || !body.title.trim()) {
    throw createAppError(400, 'title is required.', 'INVALID_REQUEST_BODY');
  }

  if (typeof body.description !== 'string' || !body.description.trim()) {
    throw createAppError(400, 'description is required.', 'INVALID_REQUEST_BODY');
  }

  if (typeof body.safetyWarning !== 'string' || !body.safetyWarning.trim()) {
    throw createAppError(400, 'safetyWarning is required.', 'INVALID_REQUEST_BODY');
  }

  if (typeof body.escalationAdvice !== 'string' || !body.escalationAdvice.trim()) {
    throw createAppError(400, 'escalationAdvice is required.', 'INVALID_REQUEST_BODY');
  }

  if (typeof body.selfServiceEligible !== 'boolean') {
    throw createAppError(400, 'selfServiceEligible must be a boolean.', 'INVALID_REQUEST_BODY');
  }

  return {
    manufacturerId: body.manufacturerId.trim(),
    modelIds: parseStringArray(body.modelIds, 'modelIds'),
    code: body.code.trim(),
    title: body.title.trim(),
    description: body.description.trim(),
    severity: parseSeverity(body.severity),
    selfServiceEligible: body.selfServiceEligible,
    safetyWarning: body.safetyWarning.trim(),
    probableCauses: parseStringArray(body.probableCauses, 'probableCauses'),
    requiredTools: parseStringArray(body.requiredTools, 'requiredTools'),
    requiredParts: parseStringArray(body.requiredParts, 'requiredParts'),
    maintenanceChecks: parseStringArray(body.maintenanceChecks, 'maintenanceChecks'),
    repairSteps: parseStringArray(body.repairSteps, 'repairSteps'),
    escalationAdvice: body.escalationAdvice.trim(),
  };
};

export const createTractorRouter = (service = new DiagnosticService()): Router => {
  const router = Router();

  router.get('/brands', (req: Request, res: Response) => {
    void req;
    res.json({ manufacturers: service.listManufacturers() });
  });

  router.get('/models', (req: Request, res: Response) => {
    const manufacturerId =
      typeof req.query.manufacturerId === 'string' ? req.query.manufacturerId : undefined;
    res.json({ models: service.listModels(manufacturerId) });
  });

  return router;
};

export const createDiagnosticsRouter = (service = new DiagnosticService()): Router => {
  const router = Router();

  router.get('/codes/lookup', (req: Request, res: Response) => {
    const manufacturerId =
      typeof req.query.manufacturerId === 'string' ? req.query.manufacturerId : undefined;
    const modelId = typeof req.query.modelId === 'string' ? req.query.modelId : undefined;
    const code = typeof req.query.code === 'string' ? req.query.code : undefined;

    if (!manufacturerId || !code) {
      throw createAppError(
        400,
        'manufacturerId and code query parameters are required.',
        'INVALID_REQUEST_QUERY'
      );
    }

    res.json({
      lookup: service.lookupCode({
        manufacturerId,
        modelId,
        code,
      }),
    });
  });

  router.post('/codes/lookup', (req: Request, res: Response) => {
    res.json({
      lookup: service.lookupCode({
        manufacturerId: req.body.manufacturerId,
        modelId: req.body.modelId,
        code: req.body.code,
      }),
    });
  });

  router.get('/symptoms/search', (req: Request, res: Response) => {
    const symptom = typeof req.query.symptom === 'string' ? req.query.symptom : undefined;

    if (!symptom) {
      throw createAppError(400, 'symptom query parameter is required.', 'INVALID_REQUEST_QUERY');
    }

    const manufacturerId =
      typeof req.query.manufacturerId === 'string' ? req.query.manufacturerId : undefined;
    const modelId = typeof req.query.modelId === 'string' ? req.query.modelId : undefined;

    res.json({
      result: service.searchSymptoms({
        manufacturerId,
        modelId,
        symptom,
      }),
    });
  });

  router.post('/symptoms/search', (req: Request, res: Response) => {
    res.json({
      result: service.searchSymptoms({
        manufacturerId: req.body.manufacturerId,
        modelId: req.body.modelId,
        symptom: req.body.symptom,
      }),
    });
  });

  return router;
};

export const createCatalogRouter = (service = new DiagnosticService()): Router => {
  const router = Router();

  router.get('/summary', (req: Request, res: Response) => {
    void req;
    res.json({
      summary: {
        manufacturers: service.listManufacturers().length,
        models: service.listModels().length,
        diagnosticCodes: service.listDiagnosticCodes({}).length,
      },
    });
  });

  router.get('/codes', (req: Request, res: Response) => {
    const manufacturerId =
      typeof req.query.manufacturerId === 'string' ? req.query.manufacturerId : undefined;
    const modelId = typeof req.query.modelId === 'string' ? req.query.modelId : undefined;
    const code = typeof req.query.code === 'string' ? req.query.code : undefined;

    res.json({
      codes: service.listDiagnosticCodes({
        manufacturerId,
        modelId,
        code,
      }),
    });
  });

  router.post(
    '/codes',
    asyncHandler((req: Request, res: Response) => {
      const payload = parseDiagnosticCodePayload(req.body as Record<string, unknown>);
      const diagnosticCode = service.upsertDiagnosticCode(payload);
      res.status(201).json({ diagnosticCode });
    })
  );

  return router;
};
