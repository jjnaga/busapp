# Busapp by Nagahama Group
Leverage TheBusAPI and GTFS data to show information on bus schedule and bus arrival times

- Get notified when buses are coming.

## Quick Overview
There are three main components: frontend, backend, and services.

### Frontend
- Angular
- Query backend with WebSockets

### Backend
- Express with Websockets

### Services
- Node.js with BullMQ to run jobs which query TheBus API

## Steps to Get Started

1. Clone the repository.
2. Copy `services/workers/worker-bus-api/.env.example` file to `services/workers/worker-bus-api/.env`.
3. Enter your API key in the `.env` file for the worker component (TheBus API key). You can obtain the API key from [TheBus API Info](https://hea.thebus.org/api_info.asp).
4. Run the following command to start the development environment:
    ```bash
    docker-compose up -f docker-compose.dev.yml
    ```