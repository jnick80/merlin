import { DiagnosticService } from '../services/diagnosticService';

describe('DiagnosticService', () => {
  const service = new DiagnosticService();

  it('requires model selection when a code varies by model', () => {
    const lookup = service.lookupCode({
      manufacturerId: 'john-deere',
      code: 'JD-FUEL-01',
    });

    expect(lookup.status).toBe('needs-model-selection');
    expect(lookup.suggestedModels?.map((model) => model.id).sort()).toEqual(['jd-5e', 'jd-6m']);
  });

  it('returns model-specific critical guidance when the exact model is provided', () => {
    const lookup = service.lookupCode({
      manufacturerId: 'john-deere',
      modelId: 'jd-6m',
      code: 'JD-FUEL-01',
    });

    expect(lookup.status).toBe('match');
    expect(lookup.codeDefinition?.severity).toBe('critical');
    expect(lookup.guidance.canContinueOperating).toBe(false);
    expect(lookup.guidance.recommendationType).toBe('stop-and-service');
  });

  it('classifies maintenance reminders as schedule-service guidance', () => {
    const lookup = service.lookupCode({
      manufacturerId: 'kubota',
      modelId: 'kubota-m7',
      code: 'KUB-LUBE-20',
    });

    expect(lookup.status).toBe('match');
    expect(lookup.codeDefinition?.severity).toBe('maintenance');
    expect(lookup.guidance.recommendationType).toBe('schedule-service');
    expect(lookup.guidance.maintenanceFocus).toBe(true);
  });

  it('returns conservative fallback guidance for unknown codes', () => {
    const lookup = service.lookupCode({
      manufacturerId: 'case-ih',
      modelId: 'case-magnum',
      code: 'UNKNOWN-999',
    });

    expect(lookup.status).toBe('not-found');
    expect(lookup.guidance.recommendationType).toBe('technician');
    expect(lookup.guidance.canContinueOperating).toBe(false);
  });

  it('searches symptom guides by symptom text', () => {
    const result = service.searchSymptoms({
      manufacturerId: 'new-holland',
      symptom: 'pto warning',
    });

    expect(result.matches).toHaveLength(1);
    expect(result.matches[0].guide.id).toBe('symptom-pto-dropout');
  });
});
