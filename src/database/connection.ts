import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { env } from '../config/env';
import { createSectionLogger } from '../utils/logger';

const databaseLogger = createSectionLogger('database');

export class Database {
  private static instance: Database;
  private pool: Pool;

  private constructor() {
    this.pool = new Pool({
      host: env.DB_HOST,
      port: env.DB_PORT,
      database: env.DB_NAME,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
    });
  }

  public static getInstance(): Database {
    if (!Database.instance) Database.instance = new Database();
    return Database.instance;
  }

  public async connect(): Promise<void> {
    try {
      const client = await this.pool.connect();
      databaseLogger.info('Database connection test successful', {
        host: env.DB_HOST,
        database: env.DB_NAME,
        port: env.DB_PORT,
      });
      client.release();
    } catch (error) {
      databaseLogger.error('Database connection failed', {
        host: env.DB_HOST,
        database: env.DB_NAME,
        port: env.DB_PORT,
        error,
      });
      throw error;
    }
  }

  public async query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[]
  ): Promise<QueryResult<T>> {
    try {
      return await this.pool.query<T>(text, params);
    } catch (error) {
      databaseLogger.error('Database query failed', {
        statement: text,
        parameterCount: params?.length ?? 0,
        error,
      });
      throw error;
    }
  }

  public async getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }

  public async disconnect(): Promise<void> {
    await this.pool.end();
    databaseLogger.info('Database connection closed', {
      host: env.DB_HOST,
      database: env.DB_NAME,
      port: env.DB_PORT,
    });
  }
}
