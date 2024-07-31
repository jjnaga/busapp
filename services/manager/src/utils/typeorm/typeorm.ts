import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Vehicle } from '@utils/typeorm/entities/Vehicle';
import { Notification } from '@utils/typeorm/entities/Notification';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT!, 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  // synchronize: process.env.NODE_ENVIRONMENT === 'development' ? true : false,
  // logging: process.env.NODE_ENVIRONMENT === 'development' ? true : false,
  // logger:
  //   process.env.NODE_ENVIRONMENT === 'development'
  //     ? 'advanced-console'
  //     : undefined,
  entities: [Vehicle, Notification],
  migrations: [],
  subscribers: [],
  schema: process.env.DB_SCHEMA,
});
