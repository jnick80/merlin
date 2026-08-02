import { createAppError } from '../../platform/errors';
import { createSectionLogger } from '../../utils/logger';
import { CatalogRepository } from '../repositories/catalogRepository';
import {
  DiagnosticCodeDefinition,
  DiagnosticCodeUpsertInput,
  FarmerGuidance,
  LookupInput,
  LookupResponse,
  Manufacturer,
  SymptomGuide,
  SymptomSearchInput,
  TractorModel,
} from '../types';

const diagnosticsLogger = createSectionLogger('diagnostics');

const normalizeCode = (code: string): string => code.trim().toUpperCase().replace(/\s+/g, '');
const normalizeText = (value: string): string => value.trim().toLowerCase();

export class DiagnosticService {
  constructor(private readonly repository = CatalogRepository.getInstance()) {}

  public listManufacturers(): Manufacturer[] {
    return this.repository.listManufacturers();
  }

  public listModels(manufacturerId?: string): TractorModel[] {
    if (manufacturerId && !this.repository.getManufacturerById(manufacturerId)) {
      throw createAppError(404, 'Manufacturer not found.', 'MANUFACTURER_NOT_FOUND');
    }

    return this.repository.listModels(manufacturerId);
  }

  public listDiagnosticCodes(filters: {
    manufacturerId?: string;
    modelId?: string;
    code?: string;
  }): DiagnosticCodeDefinition[] {
    if (filters.manufacturerId) {
      this.requireManufacturer(filters.manufacturerId);
    }

    if (filters.modelId) {
      this.requireModel(filters.modelId, filters.manufacturerId);
    }

    return this.repository.listDiagnosticCodes(filters);
  }

  public lookupCode(input: LookupInput): LookupResponse {
    const manufacturer = this.requireManufacturer(input.manufacturerId);
    const normalizedCode = this.requireCode(input.code);
    const model = input.modelId ? this.requireModel(input.modelId, manufacturer.id) : undefined;
    const matches = this.repository.listDiagnosticCodes({
      manufacturerId: manufacturer.id,
      code: normalizedCode,
    });

    diagnosticsLogger.info('Diagnostic code lookup requested', {
      manufacturerId: manufacturer.id,
      modelId: model?.id ?? null,
      code: normalizedCode,
      matchCount: matches.length,
    });

    if (matches.length === 0) {
      return {
        status: 'not-found',
        requestedCode: input.code,
        normalizedCode,
        manufacturer,
        model,
        guidance: {
          canContinueOperating: false,
          recommendationType: 'technician',
          summary:
            'The code is not yet in the local catalog. Use the symptom search and compare the result with the operator or service manual before continuing field work.',
          nextSteps: [
            'Confirm the code was entered exactly as shown on the tractor display.',
            'Capture the tractor brand, exact model, engine hours, and any active symptoms.',
            'Use the symptom-search endpoint or operator manual to narrow the issue.',
          ],
          maintenanceFocus: false,
        },
      };
    }

    if (model) {
      const exactMatch =
        matches.find((candidate) => candidate.modelIds.includes(model.id)) ??
        matches.find((candidate) => candidate.modelIds.length === 0);

      if (!exactMatch) {
        return {
          status: 'not-found',
          requestedCode: input.code,
          normalizedCode,
          manufacturer,
          model,
          guidance: {
            canContinueOperating: false,
            recommendationType: 'technician',
            summary:
              'The code exists for this manufacturer, but there is no local guidance for the selected tractor model.',
            nextSteps: [
              'Verify the tractor model selection.',
              'Compare the code against the operator or service manual for the selected tractor.',
              'Add the model-specific guidance to the local catalog if you have verified instructions.',
            ],
            maintenanceFocus: false,
          },
        };
      }

      return {
        status: 'match',
        requestedCode: input.code,
        normalizedCode,
        manufacturer,
        model,
        codeDefinition: exactMatch,
        guidance: this.buildGuidance(exactMatch),
      };
    }

    const manufacturerWideMatch = matches.find((candidate) => candidate.modelIds.length === 0);

    if (manufacturerWideMatch) {
      return {
        status: 'match',
        requestedCode: input.code,
        normalizedCode,
        manufacturer,
        codeDefinition: manufacturerWideMatch,
        guidance: this.buildGuidance(manufacturerWideMatch),
      };
    }

    const suggestedModels = this.modelsFromMatches(matches);

    return {
      status: 'needs-model-selection',
      requestedCode: input.code,
      normalizedCode,
      manufacturer,
      suggestedModels,
      guidance: {
        canContinueOperating: false,
        recommendationType: 'technician',
        summary:
          'This code changes by tractor model, so select the exact model before following repair guidance.',
        nextSteps: [
          'Choose the exact tractor model shown on the serial plate or display.',
          'Re-run the code lookup with the modelId to get the correct steps.',
          'If you cannot confirm the model, use the most conservative safety guidance and pause heavy work.',
        ],
        maintenanceFocus: false,
      },
    };
  }

  public searchSymptoms(input: SymptomSearchInput): {
    symptom: string;
    manufacturer?: Manufacturer;
    model?: TractorModel;
    matches: Array<{
      guide: SymptomGuide;
      guidance: FarmerGuidance;
    }>;
  } {
    const manufacturer = input.manufacturerId
      ? this.requireManufacturer(input.manufacturerId)
      : undefined;
    const model = input.modelId ? this.requireModel(input.modelId, input.manufacturerId) : undefined;
    const normalizedSymptom = normalizeText(input.symptom);

    if (!normalizedSymptom) {
      throw createAppError(400, 'symptom is required.', 'SYMPTOM_REQUIRED');
    }

    const matches = this.repository
      .listSymptomGuides(manufacturer?.id, model?.id)
      .filter(
        (guide) =>
          normalizeText(guide.title).includes(normalizedSymptom) ||
          normalizeText(guide.summary).includes(normalizedSymptom) ||
          guide.symptoms.some((symptom) => normalizeText(symptom).includes(normalizedSymptom))
      )
      .map((guide) => ({
        guide,
        guidance: this.buildSymptomGuidance(guide),
      }));

    diagnosticsLogger.info('Symptom search requested', {
      manufacturerId: manufacturer?.id ?? null,
      modelId: model?.id ?? null,
      symptom: normalizedSymptom,
      matchCount: matches.length,
    });

    return {
      symptom: input.symptom,
      manufacturer,
      model,
      matches,
    };
  }

  public upsertDiagnosticCode(input: DiagnosticCodeUpsertInput): DiagnosticCodeDefinition {
    this.requireManufacturer(input.manufacturerId);

    for (const modelId of input.modelIds ?? []) {
      this.requireModel(modelId, input.manufacturerId);
    }

    if (!input.title.trim()) {
      throw createAppError(400, 'title is required.', 'TITLE_REQUIRED');
    }

    const normalizedCode = this.requireCode(input.code);

    const saved = this.repository.upsertDiagnosticCode({
      ...input,
      code: normalizedCode,
    });

    diagnosticsLogger.info('Diagnostic catalog updated', {
      manufacturerId: input.manufacturerId,
      modelIds: input.modelIds ?? [],
      code: normalizedCode,
      version: saved.version,
      source: saved.source,
    });

    return saved;
  }

  private requireManufacturer(manufacturerId: string): Manufacturer {
    const manufacturer = this.repository.getManufacturerById(manufacturerId);

    if (!manufacturer) {
      throw createAppError(404, 'Manufacturer not found.', 'MANUFACTURER_NOT_FOUND');
    }

    return manufacturer;
  }

  private requireModel(modelId: string, manufacturerId?: string): TractorModel {
    const model = this.repository.getModelById(modelId);

    if (!model) {
      throw createAppError(404, 'Tractor model not found.', 'MODEL_NOT_FOUND');
    }

    if (manufacturerId && model.manufacturerId !== manufacturerId) {
      throw createAppError(
        400,
        'The selected model does not belong to the selected manufacturer.',
        'MODEL_MANUFACTURER_MISMATCH'
      );
    }

    return model;
  }

  private requireCode(code: string): string {
    const normalized = normalizeCode(code);

    if (!normalized) {
      throw createAppError(400, 'code is required.', 'CODE_REQUIRED');
    }

    return normalized;
  }

  private modelsFromMatches(matches: DiagnosticCodeDefinition[]): TractorModel[] {
    const modelIds = Array.from(new Set(matches.flatMap((match) => match.modelIds)));
    return modelIds
      .map((modelId) => this.repository.getModelById(modelId))
      .filter((model): model is TractorModel => Boolean(model));
  }

  private buildGuidance(definition: DiagnosticCodeDefinition): FarmerGuidance {
    switch (definition.severity) {
      case 'maintenance':
        return {
          canContinueOperating: true,
          recommendationType: 'schedule-service',
          summary: 'This is a maintenance item. Complete the listed service soon to prevent larger problems.',
          nextSteps: definition.repairSteps,
          maintenanceFocus: true,
        };
      case 'advisory':
        return {
          canContinueOperating: true,
          recommendationType: definition.selfServiceEligible ? 'monitor' : 'technician',
          summary:
            'You can usually continue light operation while checking the issue, but monitor the tractor closely and stop if performance worsens.',
          nextSteps: definition.repairSteps,
          maintenanceFocus: false,
        };
      case 'warning':
        return {
          canContinueOperating: false,
          recommendationType: definition.selfServiceEligible ? 'self-service' : 'technician',
          summary:
            'Reduce load and address this issue before continuing normal work to avoid a more serious failure.',
          nextSteps: definition.repairSteps,
          maintenanceFocus: false,
        };
      case 'critical':
      default:
        return {
          canContinueOperating: false,
          recommendationType: 'stop-and-service',
          summary:
            'Stop operation as soon as it is safe. Use only basic inspection steps before arranging further service.',
          nextSteps: definition.repairSteps,
          maintenanceFocus: false,
        };
    }
  }

  private buildSymptomGuidance(guide: SymptomGuide): FarmerGuidance {
    const definition: DiagnosticCodeDefinition = {
      id: guide.id,
      manufacturerId: guide.manufacturerId ?? 'unknown',
      modelIds: guide.modelIds,
      code: guide.title,
      title: guide.title,
      description: guide.summary,
      severity: guide.severity,
      selfServiceEligible: guide.severity !== 'critical',
      safetyWarning: guide.escalationAdvice,
      probableCauses: [],
      requiredTools: [],
      requiredParts: [],
      maintenanceChecks: [],
      repairSteps: guide.guidanceSteps,
      escalationAdvice: guide.escalationAdvice,
      version: 1,
      source: 'seed',
      updatedAt: new Date().toISOString(),
    };

    return this.buildGuidance(definition);
  }
}
