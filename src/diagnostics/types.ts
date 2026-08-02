export type GuidanceSeverity = 'maintenance' | 'advisory' | 'warning' | 'critical';

export type RecommendationType =
  'self-service' | 'monitor' | 'schedule-service' | 'stop-and-service' | 'technician';

export interface Manufacturer {
  id: string;
  name: string;
  supportedCodeSystems: string[];
}

export interface TractorModel {
  id: string;
  manufacturerId: string;
  family: string;
  model: string;
  productionYears: string;
}

export interface DiagnosticCodeDefinition {
  id: string;
  manufacturerId: string;
  modelIds: string[];
  code: string;
  title: string;
  description: string;
  severity: GuidanceSeverity;
  selfServiceEligible: boolean;
  safetyWarning: string;
  probableCauses: string[];
  requiredTools: string[];
  requiredParts: string[];
  maintenanceChecks: string[];
  repairSteps: string[];
  escalationAdvice: string;
  version: number;
  source: 'seed' | 'manual';
  updatedAt: string;
}

export interface SymptomGuide {
  id: string;
  manufacturerId?: string;
  modelIds: string[];
  symptoms: string[];
  title: string;
  summary: string;
  severity: GuidanceSeverity;
  guidanceSteps: string[];
  escalationAdvice: string;
}

export interface FarmerGuidance {
  canContinueOperating: boolean;
  recommendationType: RecommendationType;
  summary: string;
  nextSteps: string[];
  maintenanceFocus: boolean;
}

export interface LookupInput {
  manufacturerId: string;
  code: string;
  modelId?: string;
}

export interface SymptomSearchInput {
  symptom: string;
  manufacturerId?: string;
  modelId?: string;
}

export interface LookupResponse {
  status: 'match' | 'needs-model-selection' | 'not-found';
  requestedCode: string;
  normalizedCode: string;
  manufacturer: Manufacturer;
  model?: TractorModel;
  suggestedModels?: TractorModel[];
  codeDefinition?: DiagnosticCodeDefinition;
  guidance: FarmerGuidance;
}

export interface CatalogSnapshot {
  manufacturers: Manufacturer[];
  models: TractorModel[];
  diagnosticCodes: DiagnosticCodeDefinition[];
  symptomGuides: SymptomGuide[];
}

export interface DiagnosticCodeUpsertInput {
  manufacturerId: string;
  modelIds?: string[];
  code: string;
  title: string;
  description: string;
  severity: GuidanceSeverity;
  selfServiceEligible: boolean;
  safetyWarning: string;
  probableCauses?: string[];
  requiredTools?: string[];
  requiredParts?: string[];
  maintenanceChecks?: string[];
  repairSteps?: string[];
  escalationAdvice: string;
}
