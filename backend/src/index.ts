import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helloRoutes from '@routes/helloRoutes';
import { AppDataSource } from '@typeorm/typeorm';
import vehiclesRoutes from '@routes/vehiclesRoutes';
import http from 'http';
import { WebSocketServer } from 'ws';

(async () => {
  const port = process.env.EXPRESS_PORT || 3000;
  const corsOptions = { origin: ['http://localhost:4200', 'https://nagahama-group.com'] };

  // Initialize TypeORM
  await AppDataSource.initialize();

  // Initialize Express
  const app = express();

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
    const data = JSON.stringify({ message: message });

    wss.clients.forEach((client) => {
      if (client.readyState === client.OPEN) {
        client.send(data);
      }
    });
  };

  setInterval(() => {
    const message = `Server message at ${new Date().toISOString()}`;
    console.log('Broadcasting message: ', message);
    broadcast(message);
  }, 10000);

  // Listen
  server.listen(port, () => {
    console.log(`HTTP Server -> Express running on http://localhost:${port}`);
  });
})();
