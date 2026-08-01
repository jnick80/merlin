import { PoolClient, QueryResult } from 'pg';
import { Database } from '../../database/connection';
import {
  CreateWorkloadInput,
  RuntimeEvent,
  RuntimeHealth,
  RuntimeInstance,
  RuntimeLogEntry,
  RuntimeStatus,
  Workload
} from '../types';
import { RuntimeRepository } from '../services/runtimeManager';

interface RuntimeStateUpdate {
  status: RuntimeStatus;
  healthStatus: RuntimeHealth;
  runtimeMetadata?: Record<string, unknown>;
  assignedNode?: string | null;
  startedAt?: Date | null;
  stoppedAt?: Date | null;
  deletedAt?: Date | null;
}

const mapWorkload = (row: Record<string, unknown>): Workload => ({
  id: row.id as string,
  entityId: row.entity_id as string,
  ownerId: row.owner_id as string,
  name: row.name as string,
  description: (row.description as string | null) ?? null,
  template: row.template as string,
  desiredImage: (row.desired_image as string | null) ?? null,
  runtimeClass: row.runtime_class as string,
  config: (row.config as Record<string, unknown>) ?? {},
  networkExposed: row.network_exposed as boolean,
  resourcePolicy: (row.resource_policy as Record<string, unknown>) ?? {},
  createdAt: new Date(row.created_at as string).toISOString(),
  updatedAt: new Date(row.updated_at as string).toISOString()
});

const mapRuntime = (row: Record<string, unknown>): RuntimeInstance => ({
  id: row.id as string,
  entityId: row.entity_id as string,
  workloadId: row.workload_id as string,
  ownerId: row.owner_id as string,
  workloadName: row.workload_name as string,
  status: row.status as RuntimeStatus,
  healthStatus: row.health_status as RuntimeHealth,
  isolationMode: row.isolation_mode as string,
  template: row.template as string,
  assignedNode: (row.assigned_node as string | null) ?? null,
  launchRequest: (row.launch_request as Record<string, unknown>) ?? {},
  runtimeMetadata: (row.runtime_metadata as Record<string, unknown>) ?? {},
  createdAt: new Date(row.created_at as string).toISOString(),
  updatedAt: new Date(row.updated_at as string).toISOString(),
  startedAt: row.started_at ? new Date(row.started_at as string).toISOString() : null,
  stoppedAt: row.stopped_at ? new Date(row.stopped_at as string).toISOString() : null,
  deletedAt: row.deleted_at ? new Date(row.deleted_at as string).toISOString() : null
});

export class PlatformRepository implements RuntimeRepository {
  private readonly db = Database.getInstance();

  public async createWorkload(input: CreateWorkloadInput): Promise<Workload> {
    const client = await this.db.getClient();

    try {
      await client.query('BEGIN');
      const entityResult = await client.query(
        `INSERT INTO entities (type, name, description)
         VALUES ($1, $2, $3)
         RETURNING id`,
        ['workload', input.name, input.description ?? null]
      );

      const workloadResult = await client.query(
        `INSERT INTO platform_workloads (
            entity_id,
            owner_id,
            name,
            template,
            desired_image,
            runtime_class,
            config,
            network_exposed,
            resource_policy
          ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9::jsonb)
          RETURNING *`,
        [
          entityResult.rows[0].id,
          input.ownerId,
          input.name,
          input.template,
          input.desiredImage ?? null,
          'local-simulated',
          JSON.stringify(input.config ?? {}),
          input.networkExposed ?? false,
          JSON.stringify(input.resourcePolicy ?? {})
        ]
      );

      await this.insertHistory(client, entityResult.rows[0].id, 'workload.created', {
        ownerId: input.ownerId,
        template: input.template,
        networkExposed: input.networkExposed ?? false,
        desiredImage: input.desiredImage ?? null
      });

      await client.query('COMMIT');
      return this.getWorkloadById(workloadResult.rows[0].id, input.ownerId, client) as Promise<Workload>;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  public async listWorkloads(ownerId?: string): Promise<Workload[]> {
    const result = await this.db.query(
      `SELECT pw.*, e.description, e.created_at, e.updated_at
       FROM platform_workloads pw
       INNER JOIN entities e ON e.id = pw.entity_id
       ${ownerId ? 'WHERE pw.owner_id = $1' : ''}
       ORDER BY pw.created_at DESC`,
      ownerId ? [ownerId] : []
    );

    return result.rows.map((row: Record<string, unknown>) => mapWorkload(row));
  }

  public async getWorkloadById(id: string, ownerId?: string, client?: PoolClient): Promise<Workload | null> {
    const params: unknown[] = [id];
    const ownerClause = ownerId ? 'AND pw.owner_id = $2' : '';

    if (ownerId) {
      params.push(ownerId);
    }

    const query = `SELECT pw.*, e.description, e.created_at, e.updated_at
       FROM platform_workloads pw
       INNER JOIN entities e ON e.id = pw.entity_id
       WHERE pw.id = $1 ${ownerClause}
       LIMIT 1`;

    const result = client
      ? await client.query(query, params)
      : await this.db.query(query, params);

    return result.rows[0] ? mapWorkload(result.rows[0]) : null;
  }

  public async createRuntimeInstance(input: {
    workload: Workload;
    ownerId: string;
    template: string;
    isolationMode: string;
    launchRequest: Record<string, unknown>;
    runtimeMetadata?: Record<string, unknown>;
  }): Promise<RuntimeInstance> {
    const client = await this.db.getClient();

    try {
      await client.query('BEGIN');
      const runtimeName = `${input.workload.name} runtime ${new Date().toISOString()}`;
      const entityResult = await client.query(
        `INSERT INTO entities (type, name, description)
         VALUES ($1, $2, $3)
         RETURNING id`,
        ['runtime_instance', runtimeName, `Runtime for workload ${input.workload.name}`]
      );

      const runtimeResult = await client.query(
        `INSERT INTO runtime_instances (
            entity_id,
            workload_id,
            owner_id,
            status,
            health_status,
            isolation_mode,
            template,
            assigned_node,
            launch_request,
            runtime_metadata
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, NULL, $8::jsonb, $9::jsonb)
          RETURNING *`,
        [
          entityResult.rows[0].id,
          input.workload.id,
          input.ownerId,
          'pending',
          'unknown',
          input.isolationMode,
          input.template,
          JSON.stringify(input.launchRequest),
          JSON.stringify(input.runtimeMetadata ?? {})
        ]
      );

      await this.insertHistory(client, entityResult.rows[0].id, 'runtime.pending', {
        workloadId: input.workload.id,
        template: input.template,
        isolationMode: input.isolationMode
      });

      await client.query('COMMIT');
      return this.getRuntimeById(runtimeResult.rows[0].id, input.ownerId, client) as Promise<RuntimeInstance>;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  public async listRuntimes(ownerId?: string): Promise<RuntimeInstance[]> {
    const params: unknown[] = [];
    const whereClause = ownerId ? 'WHERE ri.owner_id = $1' : '';

    if (ownerId) {
      params.push(ownerId);
    }

    const result = await this.db.query(
      `SELECT ri.*, pw.name AS workload_name
       FROM runtime_instances ri
       INNER JOIN platform_workloads pw ON pw.id = ri.workload_id
       ${whereClause}
       ORDER BY ri.created_at DESC`,
      params
    );

    return result.rows.map((row: Record<string, unknown>) => mapRuntime(row));
  }

  public async getRuntimeById(id: string, ownerId?: string, client?: PoolClient): Promise<RuntimeInstance | null> {
    const params: unknown[] = [id];
    const ownerClause = ownerId ? 'AND ri.owner_id = $2' : '';

    if (ownerId) {
      params.push(ownerId);
    }

    const query = `SELECT ri.*, pw.name AS workload_name
       FROM runtime_instances ri
       INNER JOIN platform_workloads pw ON pw.id = ri.workload_id
       WHERE ri.id = $1 ${ownerClause}
       LIMIT 1`;

    const result = client
      ? await client.query(query, params)
      : await this.db.query(query, params);

    return result.rows[0] ? mapRuntime(result.rows[0]) : null;
  }

  public async updateRuntimeState(runtimeId: string, state: RuntimeStateUpdate): Promise<RuntimeInstance> {
    const result = await this.db.query(
      `UPDATE runtime_instances
       SET status = $2,
           health_status = $3,
           assigned_node = COALESCE($4, assigned_node),
           runtime_metadata = CASE
             WHEN $5::jsonb IS NULL THEN runtime_metadata
             ELSE runtime_metadata || $5::jsonb
           END,
           started_at = COALESCE($6, started_at),
           stopped_at = COALESCE($7, stopped_at),
           deleted_at = COALESCE($8, deleted_at),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [
        runtimeId,
        state.status,
        state.healthStatus,
        state.assignedNode ?? null,
        state.runtimeMetadata ? JSON.stringify(state.runtimeMetadata) : null,
        state.startedAt ?? null,
        state.stoppedAt ?? null,
        state.deletedAt ?? null
      ]
    );

    return this.getRuntimeById(result.rows[0].id) as Promise<RuntimeInstance>;
  }

  public async appendRuntimeHistory(
    runtimeId: string,
    eventType: string,
    eventData: Record<string, unknown>,
    createdBy?: string
  ): Promise<void> {
    const runtime = await this.getRuntimeRecord(runtimeId);
    await this.db.query(
      `INSERT INTO history (entity_id, event_type, event_data, created_by)
       VALUES ($1, $2, $3::jsonb, NULL)`,
      [runtime.entity_id, eventType, JSON.stringify({ ...eventData, actor: createdBy ?? null })]
    );
  }

  public async listRuntimeHistory(runtimeId: string, ownerId?: string): Promise<RuntimeEvent[]> {
    const runtime = await this.getRuntimeRecord(runtimeId, ownerId);
    const result = await this.db.query(
      `SELECT id, event_type, event_data, created_by, created_at
       FROM history
       WHERE entity_id = $1
       ORDER BY created_at ASC`,
      [runtime.entity_id]
    );

    return result.rows.map((row: Record<string, unknown>) => ({
      id: row.id as string,
      runtimeInstanceId: runtimeId,
      eventType: row.event_type as string,
      eventData: (row.event_data as Record<string, unknown>) ?? {},
      createdBy: (row.created_by as string | null) ?? null,
      createdAt: new Date(row.created_at as string).toISOString()
    }));
  }

  public async appendRuntimeLog(
    runtimeId: string,
    level: 'info' | 'warn' | 'error',
    message: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.db.query(
      `INSERT INTO runtime_logs (runtime_instance_id, level, message, metadata)
       VALUES ($1, $2, $3, $4::jsonb)`,
      [runtimeId, level, message, JSON.stringify(metadata ?? {})]
    );
  }

  public async listRuntimeLogs(runtimeId: string, ownerId?: string): Promise<RuntimeLogEntry[]> {
    await this.getRuntimeRecord(runtimeId, ownerId);
    const result = await this.db.query(
      `SELECT id, level, message, metadata, created_at
       FROM runtime_logs
       WHERE runtime_instance_id = $1
       ORDER BY created_at ASC`,
      [runtimeId]
    );

    return result.rows.map((row: Record<string, unknown>) => ({
      id: row.id as string,
      runtimeInstanceId: runtimeId,
      level: row.level as 'info' | 'warn' | 'error',
      message: row.message as string,
      metadata: (row.metadata as Record<string, unknown>) ?? {},
      createdAt: new Date(row.created_at as string).toISOString()
    }));
  }

  private async getRuntimeRecord(runtimeId: string, ownerId?: string): Promise<{ entity_id: string }> {
    const params: unknown[] = [runtimeId];
    const ownerClause = ownerId ? 'AND owner_id = $2' : '';

    if (ownerId) {
      params.push(ownerId);
    }

    const result = await this.db.query(
      `SELECT entity_id
       FROM runtime_instances
       WHERE id = $1 ${ownerClause}
       LIMIT 1`,
      params
    );

    if (!result.rows[0]) {
      throw new Error('Runtime not found.');
    }

    return result.rows[0] as { entity_id: string };
  }

  private async insertHistory(
    client: PoolClient,
    entityId: string,
    eventType: string,
    eventData: Record<string, unknown>
  ): Promise<QueryResult> {
    return client.query(
      `INSERT INTO history (entity_id, event_type, event_data, created_by)
       VALUES ($1, $2, $3::jsonb, NULL)`,
      [entityId, eventType, JSON.stringify(eventData)]
    );
  }
}
