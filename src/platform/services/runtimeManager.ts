import {
  LaunchRuntimeInput,
  RuntimeHealth,
  RuntimeInstance,
  RuntimeStatus,
  StopRuntimeInput,
  Workload,
} from '../types';
import { createSectionLogger } from '../../utils/logger';

const runtimeLogger = createSectionLogger('runtime');

export interface RuntimeRepository {
  createRuntimeInstance(input: {
    workload: Workload;
    ownerId: string;
    template: string;
    isolationMode: string;
    launchRequest: Record<string, unknown>;
    runtimeMetadata?: Record<string, unknown>;
  }): Promise<RuntimeInstance>;
  getRuntimeById(id: string, ownerId?: string): Promise<RuntimeInstance | null>;
  listRuntimes(ownerId?: string): Promise<RuntimeInstance[]>;
  updateRuntimeState(
    runtimeId: string,
    state: {
      status: RuntimeStatus;
      healthStatus: RuntimeHealth;
      runtimeMetadata?: Record<string, unknown>;
      assignedNode?: string | null;
      startedAt?: Date | null;
      stoppedAt?: Date | null;
      deletedAt?: Date | null;
    }
  ): Promise<RuntimeInstance>;
  appendRuntimeHistory(
    runtimeId: string,
    eventType: string,
    eventData: Record<string, unknown>,
    createdBy?: string
  ): Promise<void>;
  appendRuntimeLog(
    runtimeId: string,
    level: 'info' | 'warn' | 'error',
    message: string,
    metadata?: Record<string, unknown>
  ): Promise<void>;
}

export interface ExecutionManager {
  launch(workload: Workload, input: LaunchRuntimeInput): Promise<RuntimeInstance>;
  stop(runtimeId: string, input: StopRuntimeInput, ownerId?: string): Promise<RuntimeInstance>;
  remove(runtimeId: string, requestedBy?: string, ownerId?: string): Promise<RuntimeInstance>;
}

export class LocalRuntimeManager implements ExecutionManager {
  constructor(private readonly runtimeRepository: RuntimeRepository) {}

  public async launch(workload: Workload, input: LaunchRuntimeInput): Promise<RuntimeInstance> {
    const launchRequest = {
      reason: input.reason ?? 'Manual launch request',
      launchConfig: input.launchConfig ?? {},
      requestedBy: input.requestedBy ?? input.ownerId,
      requestedAt: new Date().toISOString(),
    };

    runtimeLogger.info('Runtime launch requested', {
      workloadId: workload.id,
      ownerId: input.ownerId,
      template: workload.template,
      requestedBy: launchRequest.requestedBy,
    });

    const runtime = await this.runtimeRepository.createRuntimeInstance({
      workload,
      ownerId: input.ownerId,
      template: workload.template,
      isolationMode: 'simulated-microvm',
      launchRequest,
      runtimeMetadata: {
        executor: 'local-simulated',
        sandboxKind: 'microvm-like',
        sandboxBoundary: 'out-of-process target planned; API process does not execute tenant code',
        desiredImage: workload.desiredImage,
        workloadConfig: workload.config,
      },
    });

    await this.runtimeRepository.appendRuntimeHistory(
      runtime.id,
      'runtime.launch.requested',
      launchRequest,
      input.requestedBy
    );
    await this.runtimeRepository.appendRuntimeLog(
      runtime.id,
      'info',
      'Launch request accepted by local simulated executor.',
      launchRequest
    );

    await this.runtimeRepository.updateRuntimeState(runtime.id, {
      status: 'provisioning',
      healthStatus: 'unknown',
      assignedNode: 'local-dev-host',
      runtimeMetadata: {
        ...runtime.runtimeMetadata,
        provisioningStage: 'template-validated',
      },
    });
    runtimeLogger.info('Runtime provisioning started', {
      runtimeId: runtime.id,
      workloadId: workload.id,
      ownerId: input.ownerId,
      template: workload.template,
    });
    await this.runtimeRepository.appendRuntimeHistory(
      runtime.id,
      'runtime.provisioning',
      { isolationMode: 'simulated-microvm', template: workload.template },
      input.requestedBy
    );
    await this.runtimeRepository.appendRuntimeLog(
      runtime.id,
      'info',
      'Provisioning isolated runtime placeholder for development lifecycle validation.'
    );

    const runningRuntime = await this.runtimeRepository.updateRuntimeState(runtime.id, {
      status: 'running',
      healthStatus: 'healthy',
      assignedNode: 'local-dev-host',
      startedAt: new Date(),
      runtimeMetadata: {
        ...runtime.runtimeMetadata,
        provisioningStage: 'running',
        networkExposureApproved: false,
      },
    });

    runtimeLogger.info('Runtime entered running state', {
      runtimeId: runtime.id,
      workloadId: workload.id,
      ownerId: input.ownerId,
      executionModel: 'simulated-microvm',
    });
    await this.runtimeRepository.appendRuntimeHistory(
      runtime.id,
      'runtime.running',
      {
        healthStatus: 'healthy',
        executionModel: 'simulated-microvm',
        note: 'Tenant software execution is intentionally not performed in the API process.',
      },
      input.requestedBy
    );
    await this.runtimeRepository.appendRuntimeLog(
      runtime.id,
      'info',
      'Runtime entered running state in a simulated microVM lifecycle.'
    );

    return runningRuntime;
  }

  public async stop(
    runtimeId: string,
    input: StopRuntimeInput,
    ownerId?: string
  ): Promise<RuntimeInstance> {
    const runtime = await this.requireRuntime(runtimeId, ownerId);

    if (runtime.status === 'deleted') {
      throw new Error('Deleted runtimes cannot be stopped.');
    }

    if (runtime.status === 'stopped') {
      runtimeLogger.info('Runtime stop skipped because runtime is already stopped', {
        runtimeId,
        ownerId: ownerId ?? runtime.ownerId,
      });
      return runtime;
    }

    runtimeLogger.warn('Runtime stop requested', {
      runtimeId,
      ownerId: ownerId ?? runtime.ownerId,
      requestedBy: input.requestedBy ?? null,
      reason: input.reason ?? 'Manual stop request',
    });

    await this.runtimeRepository.updateRuntimeState(runtime.id, {
      status: 'stopping',
      healthStatus: runtime.healthStatus,
      runtimeMetadata: {
        ...runtime.runtimeMetadata,
        stopReason: input.reason ?? 'Manual stop request',
      },
    });
    await this.runtimeRepository.appendRuntimeHistory(
      runtime.id,
      'runtime.stopping',
      { reason: input.reason ?? 'Manual stop request' },
      input.requestedBy
    );
    await this.runtimeRepository.appendRuntimeLog(runtime.id, 'warn', 'Runtime stop initiated.', {
      requestedBy: input.requestedBy ?? null,
    });

    const stoppedRuntime = await this.runtimeRepository.updateRuntimeState(runtime.id, {
      status: 'stopped',
      healthStatus: 'unknown',
      stoppedAt: new Date(),
      runtimeMetadata: {
        ...runtime.runtimeMetadata,
        lastStopReason: input.reason ?? 'Manual stop request',
      },
    });
    runtimeLogger.info('Runtime stopped cleanly', {
      runtimeId,
      ownerId: ownerId ?? runtime.ownerId,
      requestedBy: input.requestedBy ?? null,
      reason: input.reason ?? 'Manual stop request',
    });
    await this.runtimeRepository.appendRuntimeHistory(
      runtime.id,
      'runtime.stopped',
      { reason: input.reason ?? 'Manual stop request' },
      input.requestedBy
    );
    await this.runtimeRepository.appendRuntimeLog(runtime.id, 'info', 'Runtime stopped cleanly.');

    return stoppedRuntime;
  }

  public async remove(
    runtimeId: string,
    requestedBy?: string,
    ownerId?: string
  ): Promise<RuntimeInstance> {
    const runtime = await this.requireRuntime(runtimeId, ownerId);

    if (
      runtime.status === 'running' ||
      runtime.status === 'provisioning' ||
      runtime.status === 'pending' ||
      runtime.status === 'stopping'
    ) {
      throw new Error('Runtime must be stopped before deletion.');
    }

    const deletedRuntime = await this.runtimeRepository.updateRuntimeState(runtime.id, {
      status: 'deleted',
      healthStatus: 'unknown',
      deletedAt: new Date(),
      runtimeMetadata: {
        ...runtime.runtimeMetadata,
        deleted: true,
      },
    });

    runtimeLogger.info('Runtime marked as deleted', {
      runtimeId,
      ownerId: ownerId ?? runtime.ownerId,
      requestedBy: requestedBy ?? null,
    });
    await this.runtimeRepository.appendRuntimeHistory(
      runtime.id,
      'runtime.deleted',
      { deleted: true },
      requestedBy
    );
    await this.runtimeRepository.appendRuntimeLog(runtime.id, 'info', 'Runtime marked as deleted.');

    return deletedRuntime;
  }

  private async requireRuntime(runtimeId: string, ownerId?: string): Promise<RuntimeInstance> {
    const runtime = await this.runtimeRepository.getRuntimeById(runtimeId, ownerId);

    if (!runtime) {
      runtimeLogger.error('Runtime lookup failed', { runtimeId, ownerId: ownerId ?? null });
      throw new Error('Runtime not found.');
    }

    return runtime;
  }
}
