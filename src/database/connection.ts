import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { logger } from '../utils/logger';

export class Database {
  private static instance: Database;
  private pool: Pool;

  private constructor() {
    const databasePassword = process.env.DB_PASSWORD?.trim();

    if (!databasePassword) {
      throw new Error('DB_PASSWORD environment variable is required');
    }

    if (databasePassword === 'secure_password') {
      throw new Error('DB_PASSWORD must not use the insecure default value');
    }

    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'merlin_db',
      user: process.env.DB_USER || 'merlin_user',
      password: databasePassword
    });
  }

  public static getInstance(): Database {
    if (!Database.instance) Database.instance = new Database();
    return Database.instance;
  }

  public async connect(): Promise<void> {
    try {
      const client = await this.pool.connect();
      logger.info('Database connection test successful');
      client.release();
    } catch (error) {
      logger.error('Database connection failed', { error });
      throw error;
    }
  }

  public async query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[]
  ): Promise<QueryResult<T>> {
    try {
      return await this.pool.query(text, params);
    } catch (error) {
      logger.error('Database query failed', { error, text });
      throw error;
    }
  }

  public async getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }

  public async disconnect(): Promise<void> {
    await this.pool.end();
    logger.info('Database connection closed');
  }
}
