export interface IntegrationLayer {
  name: string;
  protocols?: string[];
  connection?: string[];
  role: string;
}

export interface ClientBuildTarget {
  platform: 'mobile' | 'desktop';
  build: 'separate';
  audience: string;
}

export interface PlatformProfile {
  productName: string;
  description: string;
  tractorIntegration: IntegrationLayer[];
  processingPipeline: string[];
  clientBuilds: ClientBuildTarget[];
}

export const platformProfile: PlatformProfile = {
  productName: 'D0!TY0UR3$3LF',
  description: 'Farmer-friendly tractor diagnostics platform with AI-assisted fault analysis.',
  tractorIntegration: [
    {
      name: 'Vehicle Network Protocols',
      protocols: ['CAN', 'J1939', 'ISOBUS', 'OBD'],
      role: 'Collect telemetry and diagnostics directly from the tractor.'
    },
    {
      name: 'Adapter Connectivity',
      connection: ['USB CAN adapter', 'Bluetooth CAN adapter'],
      role: 'Bridge field hardware into the Merlin virtual hardware layer.'
    },
    {
      name: 'Virtual Hardware Layer',
      role: 'Normalize adapter input before diagnostics are processed.'
    }
  ],
  processingPipeline: [
    'Universal Diagnostics Engine',
    'AI Fault Detection & Analysis'
  ],
  clientBuilds: [
    {
      platform: 'mobile',
      build: 'separate',
      audience: 'Farmer-friendly field diagnostics app'
    },
    {
      platform: 'desktop',
      build: 'separate',
      audience: 'Farmer-friendly workshop and office diagnostics app'
    }
  ]
};
