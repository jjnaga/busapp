import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helloRoutes from '@routes/helloRoutes';
import { AppDataSource } from '@typeorm/typeorm';
import vehiclesRoutes from '@routes/vehiclesRoutes';
import http from 'http';
import { WebSocketServer } from 'ws';
import Redis from 'ioredis';
import { VehicleSql } from '@utils/types';

(async () => {
  const port = process.env.EXPRESS_PORT || 3000;
  const corsOptions = { origin: ['http://localhost:4200', 'https://nagahama-group.com'] };
  const redisHost = process.env.REDIS_HOST || 'redis';
  const redisPort = process.env.REDIS_PORT || '6379';
  const redisVehiclesSubscribe = process.env.REDIS_VEHICLE_PUBLISH_CHANNEL || 'vehicleUpsert';

  // Initialize TypeORM
  await AppDataSource.initialize();

  // Initialize Express
  const app = express();

  // Initialize Redis for subscriptions
  const redis = new Redis(`${redisHost}:${redisPort}`);

  // Enable CORS
  app.use(cors(corsOptions));

  // Express Logging
  app.use(morgan('combined'));

  // Setup routes
  app.use('/hello', helloRoutes);
  app.use('/vehicles', vehiclesRoutes);

  const server = http.createServer(app);

  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    console.log('HTTP to WS upgrade request.');
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  });

  // Webhost listen.
  wss.on('connection', (ws) => {
    console.log('IM CONNECTED');

    ws.on('message', (message) => {
      console.log('Message received: ', message);
    });

    ws.on('close', () => {
      console.log('Client disconnected');
    });
  });

  const broadcast = (message: string) => {
    const { data } = JSON.parse(message);

    if (data.length > 0) {
      // Data comes in in postgres snake case. Format to camel case.
      const cleanedData = data.map((vehicle: VehicleSql) => ({
        busNumber: vehicle.bus_number,
        tripId: vehicle.trip_id,
        driver: vehicle.driver,
        latitude: vehicle.latitude,
        longitude: vehicle.longitude,
        adherence: vehicle.adherence,
        heartbeat: vehicle.heartbeat,
        routeName: vehicle.route_name,
        headsign: vehicle.headsign,
      }));

      const broadcastData = JSON.stringify({ message: cleanedData });

      console.log(
        `Redis subscription ${redisVehiclesSubscribe}: ${data.length} message${
          data.length > 1 && 's'
        } received. Broadcasting to ${wss.clients.size} clients.`
      );

      wss.clients.forEach((client) => {
        if (client.readyState === client.OPEN) {
          client.send(broadcastData);
        }
      });
    }
  };

  // Listen
  server.listen(port, () => {
    console.log(`HTTP Server -> Express running on http://localhost:${port}`);
  });

  // Subscribe to vehiclesUpsert
  redis.subscribe(redisVehiclesSubscribe, (err, count) => {
    if (err) {
      console.error(`Redis: Unable to subscribe to '${redisVehiclesSubscribe}': `);
    } else {
      console.info(`Redis: Subscribed to ${redisVehiclesSubscribe}. Total Subscriptions = ${count}`);
    }
  });

  redis.on('message', (channel, message) => {
    broadcast(message);
  });
})();
