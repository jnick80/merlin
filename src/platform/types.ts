export type RuntimeStatus =
  'pending' | 'provisioning' | 'running' | 'stopping' | 'stopped' | 'failed' | 'deleted';

export type RuntimeHealth = 'unknown' | 'healthy' | 'degraded' | 'unhealthy';

export interface RuntimeTemplate {
  id: string;
  name: string;
  description: string;
  isolationMode: 'simulated-microvm';
  allowsNetworkExposure: boolean;
  defaultConfig: Record<string, unknown>;
}

export interface Workload {
  id: string;
  entityId: string;
  ownerId: string;
  name: string;
  description: string | null;
  template: string;
  desiredImage: string | null;
  runtimeClass: string;
  config: Record<string, unknown>;
  networkExposed: boolean;
  resourcePolicy: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface RuntimeInstance {
  id: string;
  entityId: string;
  workloadId: string;
  ownerId: string;
  workloadName: string;
  status: RuntimeStatus;
  healthStatus: RuntimeHealth;
  isolationMode: string;
  template: string;
  assignedNode: string | null;
  launchRequest: Record<string, unknown>;
  runtimeMetadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  stoppedAt: string | null;
  deletedAt: string | null;
}

export interface RuntimeEvent {
  id: string;
  runtimeInstanceId: string;
  eventType: string;
  eventData: Record<string, unknown>;
  createdBy: string | null;
  createdAt: string;
}

export interface RuntimeLogEntry {
  id: string;
  runtimeInstanceId: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface CreateWorkloadInput {
  ownerId: string;
  name: string;
  description?: string;
  template: string;
  desiredImage?: string;
  config?: Record<string, unknown>;
  networkExposed?: boolean;
  resourcePolicy?: Record<string, unknown>;
}

export interface LaunchRuntimeInput {
  ownerId: string;
  requestedBy?: string;
  reason?: string;
  launchConfig?: Record<string, unknown>;
}

export interface StopRuntimeInput {
  requestedBy?: string;
  reason?: string;
}
