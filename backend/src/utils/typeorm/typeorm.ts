import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Vehicle } from '@typeorm/entities/Vehicle';
import { Stops } from '@typeorm/entities/Stops';

function validateEnv() {
  const requiredEnvVars = ['DB_HOST', 'DB_PORT', 'DB_DATABASE'];

  requiredEnvVars.forEach((varName) => {
    if (!process.env[varName]) {
      throw new Error(`Environment variable ${varName} is not set`);
    }
  });
}

validateEnv();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT!, 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  synchronize: false, // Don't synchronize schema
  migrationsRun: false, // Don't run migrations automatically
  dropSchema: false, // Don't drop the schema on connection
  // logging: true,
  // logger: 'advanced-console',
  entities: [Vehicle, Stops],
  migrations: [],
  subscribers: [],
  poolSize: 1000,
  // it doenst make it automatically?
  // schema: 'bus',
});
