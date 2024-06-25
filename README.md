# Busapp by Nagahama Group
Leverage TheBusAPI and GTFS data to show information on bus schedules and bus arrival times.

- Get notified when buses are coming.

## Quick Overview
There are three main components: frontend, backend, and services.

### Frontend
- Angular
- Query backend with WebSockets

### Backend
- Express with Websockets
- Subscribes to Redis for updates from services and broadcasts to clients

### Services
- Microarchitecture with manager and workers for ETL processes

## Steps to Get Started

1. Clone the repository.
2. Copy `services/workers/worker-bus-api/.env.example` file to `services/workers/worker-bus-api/.env`.
3. Enter your API key in the `.env` file for the worker component (TheBus API key). You can obtain the API key from [TheBus API Info](https://hea.thebus.org/api_info.asp).
4. Run the following command to start the development environment:
    ```bash
    docker compose -f docker-compose.dev.yml up 
    ```

## Architecture

### Frontend
- Built with Angular
- Serves the UI and connects to the backend via WebSockets to get live data

### Backend
- Built with Express
- Subscribes to Redis for updates from service workers
- Uses WebSockets to broadcast updates to connected clients
- Uses PostgreSQL for data storage

### Services
- Manager is a Node.js app (`queue-manager`) that posts jobs to Redis streams
- `worker-bus-api` (Node.js) handles ETL for TheBus API and publishes updates to Redis
- `worker-gtfs` (Python) handles ETL for GTFS data
- All workers receive jobs via Redis Stream

### Databases
- **PostgreSQL**: Used for data storage
- **Redis**: Used for job queue management and data pub/sub