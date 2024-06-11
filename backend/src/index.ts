import express from 'express';
import morgan from 'morgan';
import helloRoutes from '@routes/helloRoutes';
import { AppDataSource } from '@typeorm/typeorm';
import vehiclesRoutes from '@routes/vehiclesRoutes';

(async () => {
  // Initialize TypeORM
  await AppDataSource.initialize();

  // Initialize Express
  const app = express();
  const port = process.env.EXPRESS_PORT || 3000;

  // Express Logging
  app.use(morgan('combined'));

  // Setup routes
  app.use('/hello', helloRoutes);
  app.use('/vehicles', vehiclesRoutes);

  // Listen
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
})();
