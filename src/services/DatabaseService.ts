import { Sequelize } from 'sequelize';
import { DatabaseConfig } from '../types';

export class DatabaseService {
  private sequelize: Sequelize;

  constructor(config: DatabaseConfig) {
    this.sequelize = new Sequelize({
      host: config.host,
      port: config.port,
      database: config.database,
      username: config.username,
      password: config.password,
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
      retry: {
        match: [
          /ETIMEDOUT/,
          /EHOSTUNREACH/,
          /ECONNRESET/,
          /ECONNREFUSED/,
          /ETIMEDOUT/,
          /ESOCKETTIMEDOUT/,
          /EHOSTUNREACH/,
          /EPIPE/,
          /EAI_AGAIN/,
          /SequelizeConnectionError/,
          /SequelizeConnectionRefusedError/,
          /SequelizeHostNotFoundError/,
          /SequelizeHostNotReachableError/,
          /SequelizeInvalidConnectionError/,
          /SequelizeConnectionTimedOutError/,
        ],
        max: 3,
      },
    });
  }

  async connect(): Promise<void> {
    try {
      await this.sequelize.authenticate();
      console.log('Database connection established successfully.');
    } catch (error) {
      console.error('Unable to connect to the database:', error);
      throw error;
    }
  }

  async sync(force: boolean = false): Promise<void> {
    try {
      await this.sequelize.sync({ force });
      console.log('Database synchronized successfully.');
    } catch (error) {
      console.error('Database synchronization failed:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.sequelize.close();
      console.log('Database connection closed.');
    } catch (error) {
      console.error('Error closing database connection:', error);
      throw error;
    }
  }

  getSequelize(): Sequelize {
    return this.sequelize;
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.sequelize.authenticate();
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }
}
