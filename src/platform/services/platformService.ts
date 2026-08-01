import { createAppError } from '../errors';
import { getRuntimeTemplate, runtimeTemplates } from '../templates';
import { PlatformRepository } from '../repositories/platformRepository';
import { LocalRuntimeManager } from './runtimeManager';
import {
  CreateWorkloadInput,
  LaunchRuntimeInput,
  RuntimeEvent,
  RuntimeInstance,
  RuntimeLogEntry,
  RuntimeTemplate,
  StopRuntimeInput,
  Workload
} from '../types';

export class PlatformService {
  private readonly repository = new PlatformRepository();
  private readonly runtimeManager = new LocalRuntimeManager(this.repository);

  public async createWorkload(input: CreateWorkloadInput): Promise<Workload> {
    this.validateOwner(input.ownerId);
    this.validateWorkloadName(input.name);
    this.validateTemplate(input.template);

    return this.repository.createWorkload({
      ...input,
      config: input.config ?? {},
      resourcePolicy: input.resourcePolicy ?? {},
      networkExposed: input.networkExposed ?? false
    });
  }

  public async listWorkloads(ownerId?: string): Promise<Workload[]> {
    return this.repository.listWorkloads(ownerId);
  }

  public async getWorkload(id: string, ownerId?: string): Promise<Workload> {
    const workload = await this.repository.getWorkloadById(id, ownerId);

    if (!workload) {
      throw createAppError(404, 'Workload not found.', 'WORKLOAD_NOT_FOUND');
    }

    return workload;
  }

  public async launchRuntime(workloadId: string, input: LaunchRuntimeInput): Promise<RuntimeInstance> {
    this.validateOwner(input.ownerId);

    const workload = await this.repository.getWorkloadById(workloadId, input.ownerId);

    if (!workload) {
      throw createAppError(404, 'Workload not found for owner.', 'WORKLOAD_NOT_FOUND');
    }

    if (workload.networkExposed) {
      throw createAppError(400, 'Network-exposed workloads are not supported by the local simulated executor.', 'UNSUPPORTED_NETWORK_EXPOSURE');
    }

    return this.runtimeManager.launch(workload, input);
  }

  public async listRuntimes(ownerId?: string): Promise<RuntimeInstance[]> {
    return this.repository.listRuntimes(ownerId);
  }

  public async getRuntime(id: string, ownerId?: string): Promise<RuntimeInstance> {
    const runtime = await this.repository.getRuntimeById(id, ownerId);

    if (!runtime) {
      throw createAppError(404, 'Runtime not found.', 'RUNTIME_NOT_FOUND');
    }

    return runtime;
  }

  public async stopRuntime(id: string, input: StopRuntimeInput, ownerId?: string): Promise<RuntimeInstance> {
    try {
      return await this.runtimeManager.stop(id, input, ownerId);
    } catch (error) {
      throw this.mapRuntimeError(error);
    }
  }

  public async deleteRuntime(id: string, requestedBy?: string, ownerId?: string): Promise<RuntimeInstance> {
    try {
      return await this.runtimeManager.remove(id, requestedBy, ownerId);
    } catch (error) {
      throw this.mapRuntimeError(error);
    }
  }

  public async listRuntimeHistory(id: string, ownerId?: string): Promise<RuntimeEvent[]> {
    return this.repository.listRuntimeHistory(id, ownerId);
  }

  public async listRuntimeLogs(id: string, ownerId?: string): Promise<RuntimeLogEntry[]> {
    return this.repository.listRuntimeLogs(id, ownerId);
  }

  public listRuntimeTemplates(): RuntimeTemplate[] {
    return runtimeTemplates;
  }

  private validateOwner(ownerId: string): void {
    if (!ownerId?.trim()) {
      throw createAppError(400, 'ownerId is required.', 'OWNER_ID_REQUIRED');
    }
  }

  private validateWorkloadName(name: string): void {
    if (!name?.trim()) {
      throw createAppError(400, 'name is required.', 'WORKLOAD_NAME_REQUIRED');
    }
  }

  private validateTemplate(template: string): void {
    if (!getRuntimeTemplate(template)) {
      throw createAppError(400, `Unknown runtime template: ${template}`, 'INVALID_RUNTIME_TEMPLATE');
    }
  }

  private mapRuntimeError(error: unknown): Error {
    if (error instanceof Error) {
      if (error.message === 'Runtime not found.') {
        return createAppError(404, error.message, 'RUNTIME_NOT_FOUND');
      }

      if (error.message === 'Runtime must be stopped before deletion.') {
        return createAppError(409, error.message, 'RUNTIME_STILL_ACTIVE');
      }

      if (error.message === 'Deleted runtimes cannot be stopped.') {
        return createAppError(409, error.message, 'RUNTIME_DELETED');
      }
    }

    return createAppError(500, 'Runtime operation failed.', 'RUNTIME_OPERATION_FAILED');
  }
}
