import { randomUUID } from 'crypto';
import { seedCatalog } from '../catalog/seedCatalog';
import {
  CatalogSnapshot,
  DiagnosticCodeDefinition,
  DiagnosticCodeUpsertInput,
  Manufacturer,
  SymptomGuide,
  TractorModel,
} from '../types';

interface CodeFilters {
  manufacturerId?: string;
  modelId?: string;
  code?: string;
}

const normalizeCode = (code: string): string => code.trim().toUpperCase().replace(/\s+/g, '');

export class CatalogRepository {
  private static instance: CatalogRepository;

  private readonly manufacturers: Manufacturer[];
  private readonly models: TractorModel[];
  private readonly symptomGuides: SymptomGuide[];
  private readonly diagnosticCodes: DiagnosticCodeDefinition[];

  private constructor(snapshot: CatalogSnapshot) {
    this.manufacturers = [...snapshot.manufacturers];
    this.models = [...snapshot.models];
    this.symptomGuides = [...snapshot.symptomGuides];
    this.diagnosticCodes = [...snapshot.diagnosticCodes];
  }

  public static getInstance(): CatalogRepository {
    if (!CatalogRepository.instance) {
      CatalogRepository.instance = new CatalogRepository(seedCatalog);
    }

    return CatalogRepository.instance;
  }

  public listManufacturers(): Manufacturer[] {
    return [...this.manufacturers];
  }

  public getManufacturerById(id: string): Manufacturer | undefined {
    return this.manufacturers.find((manufacturer) => manufacturer.id === id);
  }

  public listModels(manufacturerId?: string): TractorModel[] {
    return this.models.filter(
      (model) => !manufacturerId || model.manufacturerId === manufacturerId
    );
  }

  public getModelById(id: string): TractorModel | undefined {
    return this.models.find((model) => model.id === id);
  }

  public listDiagnosticCodes(filters: CodeFilters = {}): DiagnosticCodeDefinition[] {
    const normalizedCode = filters.code ? normalizeCode(filters.code) : undefined;

    return this.diagnosticCodes.filter((definition) => {
      if (filters.manufacturerId && definition.manufacturerId !== filters.manufacturerId) {
        return false;
      }

      if (
        filters.modelId &&
        definition.modelIds.length > 0 &&
        !definition.modelIds.includes(filters.modelId)
      ) {
        return false;
      }

      if (normalizedCode && normalizeCode(definition.code) !== normalizedCode) {
        return false;
      }

      return true;
    });
  }

  public listSymptomGuides(manufacturerId?: string, modelId?: string): SymptomGuide[] {
    return this.symptomGuides.filter((guide) => {
      if (manufacturerId && guide.manufacturerId && guide.manufacturerId !== manufacturerId) {
        return false;
      }

      if (modelId && guide.modelIds.length > 0 && !guide.modelIds.includes(modelId)) {
        return false;
      }

      return true;
    });
  }

  public upsertDiagnosticCode(input: DiagnosticCodeUpsertInput): DiagnosticCodeDefinition {
    const normalizedCode = normalizeCode(input.code);
    const modelIds = input.modelIds ?? [];
    const existing = this.diagnosticCodes.find(
      (definition) =>
        definition.manufacturerId === input.manufacturerId &&
        normalizeCode(definition.code) === normalizedCode &&
        definition.modelIds.join('|') === modelIds.join('|')
    );

    if (existing) {
      existing.title = input.title;
      existing.description = input.description;
      existing.severity = input.severity;
      existing.selfServiceEligible = input.selfServiceEligible;
      existing.safetyWarning = input.safetyWarning;
      existing.probableCauses = [...(input.probableCauses ?? [])];
      existing.requiredTools = [...(input.requiredTools ?? [])];
      existing.requiredParts = [...(input.requiredParts ?? [])];
      existing.maintenanceChecks = [...(input.maintenanceChecks ?? [])];
      existing.repairSteps = [...(input.repairSteps ?? [])];
      existing.escalationAdvice = input.escalationAdvice;
      existing.version += 1;
      existing.source = 'manual';
      existing.updatedAt = new Date().toISOString();
      return existing;
    }

    const created: DiagnosticCodeDefinition = {
      id: randomUUID(),
      manufacturerId: input.manufacturerId,
      modelIds,
      code: normalizedCode,
      title: input.title,
      description: input.description,
      severity: input.severity,
      selfServiceEligible: input.selfServiceEligible,
      safetyWarning: input.safetyWarning,
      probableCauses: [...(input.probableCauses ?? [])],
      requiredTools: [...(input.requiredTools ?? [])],
      requiredParts: [...(input.requiredParts ?? [])],
      maintenanceChecks: [...(input.maintenanceChecks ?? [])],
      repairSteps: [...(input.repairSteps ?? [])],
      escalationAdvice: input.escalationAdvice,
      version: 1,
      source: 'manual',
      updatedAt: new Date().toISOString(),
    };

    this.diagnosticCodes.push(created);
    return created;
  }
}
