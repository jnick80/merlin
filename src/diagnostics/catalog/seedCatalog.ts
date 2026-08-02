import {
  CatalogSnapshot,
  DiagnosticCodeDefinition,
  Manufacturer,
  SymptomGuide,
  TractorModel,
} from '../types';

const manufacturers: Manufacturer[] = [
  {
    id: 'john-deere',
    name: 'John Deere',
    supportedCodeSystems: ['starter-mvp'],
  },
  {
    id: 'case-ih',
    name: 'Case IH',
    supportedCodeSystems: ['starter-mvp'],
  },
  {
    id: 'new-holland',
    name: 'New Holland',
    supportedCodeSystems: ['starter-mvp'],
  },
  {
    id: 'kubota',
    name: 'Kubota',
    supportedCodeSystems: ['starter-mvp'],
  },
  {
    id: 'massey-ferguson',
    name: 'Massey Ferguson',
    supportedCodeSystems: ['starter-mvp'],
  },
];

const models: TractorModel[] = [
  {
    id: 'jd-5e',
    manufacturerId: 'john-deere',
    family: '5E',
    model: '5100E',
    productionYears: '2017-present',
  },
  {
    id: 'jd-6m',
    manufacturerId: 'john-deere',
    family: '6M',
    model: '6110M',
    productionYears: '2020-present',
  },
  {
    id: 'case-magnum',
    manufacturerId: 'case-ih',
    family: 'Magnum',
    model: '250',
    productionYears: '2018-present',
  },
  {
    id: 'nh-t7',
    manufacturerId: 'new-holland',
    family: 'T7',
    model: 'T7.270',
    productionYears: '2019-present',
  },
  {
    id: 'kubota-m7',
    manufacturerId: 'kubota',
    family: 'M7',
    model: 'M7-171',
    productionYears: '2019-present',
  },
  {
    id: 'mf-5700',
    manufacturerId: 'massey-ferguson',
    family: '5700',
    model: '5713SL',
    productionYears: '2018-present',
  },
];

const diagnosticCodes: DiagnosticCodeDefinition[] = [
  {
    id: 'jd-fuel-5e',
    manufacturerId: 'john-deere',
    modelIds: ['jd-5e'],
    code: 'JD-FUEL-01',
    title: 'Fuel restriction detected at the primary filter',
    description:
      'The engine control path has detected restricted fuel flow before the high-pressure side.',
    severity: 'warning',
    selfServiceEligible: true,
    safetyWarning:
      'Reduce load immediately and shut the tractor down if power loss becomes severe or air enters the fuel system.',
    probableCauses: [
      'plugged primary fuel filter',
      'water-contaminated diesel fuel',
      'collapsed suction hose',
    ],
    requiredTools: ['filter wrench', 'clean drain pan', 'shop towels'],
    requiredParts: ['primary fuel filter', 'clean diesel fuel if contamination is present'],
    maintenanceChecks: [
      'drain water separator',
      'inspect fuel tank vent for blockage',
      'verify recent fuel source quality',
    ],
    repairSteps: [
      'Park safely, shut the tractor off, and allow fuel pressure to bleed down.',
      'Inspect the water separator and drain any contamination.',
      'Replace the primary fuel filter and refill with clean fuel if required.',
      'Bleed the fuel system according to the tractor service procedure before restart.',
    ],
    escalationAdvice:
      'If the code returns after filter service or the engine stalls repeatedly, arrange dealer fuel-system testing.',
    version: 1,
    source: 'seed',
    updatedAt: '2026-08-02T00:00:00.000Z',
  },
  {
    id: 'jd-fuel-6m',
    manufacturerId: 'john-deere',
    modelIds: ['jd-6m'],
    code: 'JD-FUEL-01',
    title: 'Fuel pressure low at common rail supply',
    description:
      'The engine control path is reading insufficient pressure at the high-pressure supply stage.',
    severity: 'critical',
    selfServiceEligible: false,
    safetyWarning:
      'Stop operation as soon as it is safe. Continued use can damage injectors or leave the tractor unable to restart.',
    probableCauses: [
      'high-pressure supply fault',
      'air intrusion in fuel feed',
      'severely restricted fuel filtration',
    ],
    requiredTools: ['flashlight', 'clean catch pan'],
    requiredParts: ['fuel filters if service interval is due'],
    maintenanceChecks: ['inspect for loose fuel connections', 'confirm filters are not overdue'],
    repairSteps: [
      'Move the tractor to a safe location and shut it down.',
      'Inspect fuel lines and filter housings for leaks or looseness.',
      'If filters are overdue, replace them before another start attempt.',
      'Do not continue field work if rail-pressure warnings remain active.',
    ],
    escalationAdvice:
      'Dealer diagnosis is recommended if the warning remains after fuel-service checks or if hard-starting is present.',
    version: 1,
    source: 'seed',
    updatedAt: '2026-08-02T00:00:00.000Z',
  },
  {
    id: 'case-hyd-12',
    manufacturerId: 'case-ih',
    modelIds: ['case-magnum'],
    code: 'CIH-HYD-12',
    title: 'Hydraulic oil temperature above preferred operating range',
    description:
      'The hydraulic system is running hotter than expected during load or repeated remote usage.',
    severity: 'warning',
    selfServiceEligible: true,
    safetyWarning:
      'Lower hydraulic load and stop if steering, remotes, or hitch response becomes erratic.',
    probableCauses: [
      'low hydraulic oil level',
      'dirty oil cooler',
      'extended high-load remote use',
    ],
    requiredTools: ['air nozzle or soft brush', 'clean rag'],
    requiredParts: ['approved hydraulic oil if topping off is needed'],
    maintenanceChecks: [
      'inspect hydraulic oil sight glass or dipstick',
      'clean the oil cooler and radiator package',
      'check for external hose leaks',
    ],
    repairSteps: [
      'Idle the tractor down and reduce hydraulic demand.',
      'Clean debris from the cooling package once components are cool enough to handle.',
      'Check hydraulic oil level and top off with the approved fluid if required.',
      'Resume light-duty operation only after the temperature normalizes.',
    ],
    escalationAdvice:
      'If temperatures keep rising after airflow and oil-level checks, schedule hydraulic system diagnosis.',
    version: 1,
    source: 'seed',
    updatedAt: '2026-08-02T00:00:00.000Z',
  },
  {
    id: 'nh-pto-04',
    manufacturerId: 'new-holland',
    modelIds: ['nh-t7'],
    code: 'NH-PTO-04',
    title: 'PTO speed signal intermittent',
    description: 'The PTO controller is losing a clean speed feedback signal during operation.',
    severity: 'advisory',
    selfServiceEligible: true,
    safetyWarning:
      'Disengage the PTO before inspecting any wiring or sensor area. Keep clear of rotating equipment.',
    probableCauses: [
      'dirty PTO speed sensor connection',
      'connector vibration',
      'wiring damage near the PTO housing',
    ],
    requiredTools: ['flashlight', 'electrical contact cleaner'],
    requiredParts: ['sensor connector seal if damaged'],
    maintenanceChecks: [
      'inspect connector seating',
      'check wiring loom for rubbing',
      'verify implement driveline is not overloading the PTO',
    ],
    repairSteps: [
      'Park safely and fully disengage the PTO.',
      'Inspect the PTO speed sensor connector for looseness or contamination.',
      'Clean and reseat the connector, then inspect the nearby harness for rub-through.',
      'Test the PTO under light load before returning to normal work.',
    ],
    escalationAdvice:
      'If the signal fault returns under light load, schedule electrical testing of the PTO speed circuit.',
    version: 1,
    source: 'seed',
    updatedAt: '2026-08-02T00:00:00.000Z',
  },
  {
    id: 'kub-lube-20',
    manufacturerId: 'kubota',
    modelIds: ['kubota-m7'],
    code: 'KUB-LUBE-20',
    title: 'Engine oil service interval overdue',
    description:
      'The maintenance monitor shows that the engine oil and filter service interval has been exceeded.',
    severity: 'maintenance',
    selfServiceEligible: true,
    safetyWarning:
      'Avoid extended high-load operation until the oil and filter service is completed.',
    probableCauses: ['scheduled maintenance interval reached'],
    requiredTools: ['oil drain pan', 'filter wrench', 'funnel'],
    requiredParts: ['approved engine oil', 'engine oil filter'],
    maintenanceChecks: [
      'confirm the correct oil grade',
      'inspect for existing oil leaks',
      'record engine hours after service',
    ],
    repairSteps: [
      'Warm the engine briefly, then shut it down and secure the tractor.',
      'Drain the engine oil and replace the filter.',
      'Refill with the approved oil quantity and grade.',
      'Run the engine, check for leaks, and reset the maintenance reminder.',
    ],
    escalationAdvice:
      'If low oil pressure, abnormal noise, or metal contamination is present, stop and request technician support.',
    version: 1,
    source: 'seed',
    updatedAt: '2026-08-02T00:00:00.000Z',
  },
  {
    id: 'mf-hyd-21',
    manufacturerId: 'massey-ferguson',
    modelIds: ['mf-5700'],
    code: 'MF-HYD-21',
    title: 'Rear hitch position response slow',
    description:
      'The hitch controller is detecting slower-than-expected response when lifting or holding position.',
    severity: 'advisory',
    selfServiceEligible: true,
    safetyWarning:
      'Do not work under a raised implement. Lower attached equipment before inspection.',
    probableCauses: [
      'low hydraulic oil level',
      'dirty hydraulic filter',
      'draft or position sensor linkage sticking',
    ],
    requiredTools: ['clean rag', 'flashlight'],
    requiredParts: ['hydraulic filter if service is due'],
    maintenanceChecks: [
      'verify hydraulic oil level',
      'inspect external hitch linkage for binding',
      'check service hours on the hydraulic filter',
    ],
    repairSteps: [
      'Lower the hitch and secure the implement.',
      'Inspect for low fluid level or visible hydraulic leaks.',
      'Check linkage movement and clean debris from pivot points.',
      'Service the hydraulic filter if the interval is due or flow seems restricted.',
    ],
    escalationAdvice:
      'If hitch drift or slow lift remains after the basic checks, schedule hydraulic pressure testing.',
    version: 1,
    source: 'seed',
    updatedAt: '2026-08-02T00:00:00.000Z',
  },
];

const symptomGuides: SymptomGuide[] = [
  {
    id: 'symptom-hard-starting',
    manufacturerId: 'john-deere',
    modelIds: ['jd-5e', 'jd-6m'],
    symptoms: ['hard starting', 'long crank', 'stalls after start'],
    title: 'Hard starting with fuel-supply symptoms',
    summary:
      'Check the fuel filter, water separator, and fuel-line integrity before deeper injector work.',
    severity: 'warning',
    guidanceSteps: [
      'Check for water contamination or plugged fuel filters.',
      'Inspect the suction side of the fuel system for loose clamps or leaks.',
      'Bleed trapped air from the fuel system after filter service.',
    ],
    escalationAdvice:
      'If the engine still cranks excessively after fuel-service checks, dealer fuel-pressure testing is recommended.',
  },
  {
    id: 'symptom-overheat-hydraulics',
    manufacturerId: 'case-ih',
    modelIds: ['case-magnum'],
    symptoms: ['hydraulic oil hot', 'remote functions slow', 'hydraulic warning'],
    title: 'Hydraulic system running hot',
    summary: 'Reduce load, clean the cooler pack, and verify fluid level before returning to work.',
    severity: 'warning',
    guidanceSteps: [
      'Reduce hydraulic demand and idle the tractor down.',
      'Clean debris from the oil cooler and radiator pack.',
      'Confirm the hydraulic oil level is within the approved range.',
    ],
    escalationAdvice:
      'If heat returns quickly, inspect for pump wear, internal leakage, or restricted cooler flow.',
  },
  {
    id: 'symptom-pto-dropout',
    manufacturerId: 'new-holland',
    modelIds: ['nh-t7'],
    symptoms: ['pto drops out', 'pto warning', 'pto speed unstable'],
    title: 'Intermittent PTO feedback or overload condition',
    summary:
      'Inspect sensor wiring and confirm the attached implement is not overloading the PTO drive.',
    severity: 'advisory',
    guidanceSteps: [
      'Disengage the PTO and inspect the speed-sensor connector.',
      'Check the implement driveline and load condition.',
      'Look for harness rubbing or contamination near the PTO housing.',
    ],
    escalationAdvice:
      'If dropout continues under light load, schedule electrical diagnosis of the PTO speed circuit.',
  },
];

export const seedCatalog: CatalogSnapshot = {
  manufacturers,
  models,
  diagnosticCodes,
  symptomGuides,
};
