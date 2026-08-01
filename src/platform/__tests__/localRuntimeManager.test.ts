import { LocalRuntimeManager, RuntimeRepository } from '../services/runtimeManager';
import { RuntimeInstance, Workload } from '../types';

const buildWorkload = (): Workload => ({
  id: 'workload-1',
  entityId: 'entity-workload-1',
  ownerId: 'tenant-a',
  name: 'Payments API',
  description: 'test workload',
  template: 'simulated-microvm',
  desiredImage: 'registry.example/payments:latest',
  runtimeClass: 'local-simulated',
  config: { cpuUnits: 256 },
  networkExposed: false,
  resourcePolicy: { maxMemoryMb: 512 },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

const buildRuntime = (): RuntimeInstance => ({
  id: 'runtime-1',
  entityId: 'entity-runtime-1',
  workloadId: 'workload-1',
  ownerId: 'tenant-a',
  workloadName: 'Payments API',
  status: 'pending',
  healthStatus: 'unknown',
  isolationMode: 'simulated-microvm',
  template: 'simulated-microvm',
  assignedNode: null,
  launchRequest: {},
  runtimeMetadata: { executor: 'local-simulated' },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  startedAt: null,
  stoppedAt: null,
  deletedAt: null
});

const createRepository = (): jest.Mocked<RuntimeRepository> => ({
  createRuntimeInstance: jest.fn(),
  getRuntimeById: jest.fn(),
  listRuntimes: jest.fn(),
  updateRuntimeState: jest.fn(),
  appendRuntimeHistory: jest.fn(),
  appendRuntimeLog: jest.fn()
});

describe('LocalRuntimeManager', () => {
  it('launches a runtime through provisioning into running state', async () => {
    const repository = createRepository();
    const manager = new LocalRuntimeManager(repository);
    const createdRuntime = buildRuntime();
    const runningRuntime: RuntimeInstance = {
      ...createdRuntime,
      status: 'running',
      healthStatus: 'healthy',
      startedAt: new Date().toISOString()
    };

    repository.createRuntimeInstance.mockResolvedValue(createdRuntime);
    repository.updateRuntimeState
      .mockResolvedValueOnce({ ...createdRuntime, status: 'provisioning' })
      .mockResolvedValueOnce(runningRuntime);

    const runtime = await manager.launch(buildWorkload(), { ownerId: 'tenant-a', requestedBy: 'ops-user' });

    expect(runtime.status).toBe('running');
    expect(repository.createRuntimeInstance).toHaveBeenCalledTimes(1);
    expect(repository.updateRuntimeState).toHaveBeenCalledTimes(2);
    expect(repository.appendRuntimeHistory).toHaveBeenCalledWith(
      'runtime-1',
      'runtime.running',
      expect.objectContaining({ executionModel: 'simulated-microvm' }),
      'ops-user'
    );
  });

  it('stops a running runtime and records stop transitions', async () => {
    const repository = createRepository();
    const manager = new LocalRuntimeManager(repository);
    const runningRuntime: RuntimeInstance = { ...buildRuntime(), status: 'running', healthStatus: 'healthy' };
    const stoppedRuntime: RuntimeInstance = {
      ...runningRuntime,
      status: 'stopped',
      healthStatus: 'unknown',
      stoppedAt: new Date().toISOString()
    };

    repository.getRuntimeById.mockResolvedValue(runningRuntime);
    repository.updateRuntimeState
      .mockResolvedValueOnce({ ...runningRuntime, status: 'stopping' })
      .mockResolvedValueOnce(stoppedRuntime);

    const runtime = await manager.stop('runtime-1', { requestedBy: 'ops-user', reason: 'maintenance' }, 'tenant-a');

    expect(runtime.status).toBe('stopped');
    expect(repository.appendRuntimeHistory).toHaveBeenCalledWith(
      'runtime-1',
      'runtime.stopped',
      { reason: 'maintenance' },
      'ops-user'
    );
  });

  it('refuses to delete a runtime that is still active', async () => {
    const repository = createRepository();
    const manager = new LocalRuntimeManager(repository);
    repository.getRuntimeById.mockResolvedValue({ ...buildRuntime(), status: 'running' });

    await expect(manager.remove('runtime-1', 'ops-user', 'tenant-a')).rejects.toThrow('Runtime must be stopped before deletion.');
  });
});
