import { Pool, PoolClient } from 'pg';
import { logger } from '../utils/logger';

export class Database {
  private static instance: Database;
  private pool: Pool;

  private constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'merlin_db',
      user: process.env.DB_USER || 'merlin_user',
      password: process.env.DB_PASSWORD || 'secure_password'
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
      logger.error('Database connection failed:', error);
      throw error;
    }
  }

  public async query(text: string, params?: unknown[]): Promise<any> {
    try {
      return await this.pool.query(text, params);
    } catch (error) {
      logger.error('Database query failed:', error);
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
