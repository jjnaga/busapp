import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helloRoutes from '@routes/helloRoutes';
import { AppDataSource } from '@typeorm/typeorm';
import vehiclesRoutes from '@routes/vehiclesRoutes';

(async () => {
  const corsOptions = { origin: ['http://localhost:4200', 'https://nagahama-group.com'] };

  // Initialize TypeORM
  await AppDataSource.initialize();

  // Initialize Express
  const app = express();

  // Enable CORS
  app.use(cors(corsOptions));

  const port = process.env.EXPRESS_PORT || 3000;

  // Express Logging
  app.use(morgan('combined'));

  // Setup routes
  app.use('/hello', helloRoutes);
  app.use('/vehicles', vehiclesRoutes);

  // Listen
  app.listen(port, () => {
    console.log(`Express is running on http://${process.env.DB_HOST}:${process.env.DB_PORT}`);
  });
})();
