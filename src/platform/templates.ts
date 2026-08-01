import { RuntimeTemplate } from './types';

export const runtimeTemplates: RuntimeTemplate[] = [
  {
    id: 'simulated-microvm',
    name: 'Simulated microVM sandbox',
    description:
      'Development-safe executor that models a microVM lifecycle without running tenant software in the API process.',
    isolationMode: 'simulated-microvm',
    allowsNetworkExposure: false,
    defaultConfig: {
      cpuUnits: 256,
      memoryMb: 512,
      rootFilesystem: 'read-only',
      networkPolicy: 'isolated',
    },
  },
];

export const getRuntimeTemplate = (templateId: string): RuntimeTemplate | undefined =>
  runtimeTemplates.find((template) => template.id === templateId);
