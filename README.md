# Busapp by Nagahama Group
Development Github for Busapp

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
2. Enter your API key in the `services/.env` file for the services component (TheBus API key). You can obtain the API key from [TheBus API Info](https://hea.thebus.org/api_info.asp).
3. Run the following command to start the development environment:
    ```bash
    docker-compose up -f docker-compose.dev.yml
    ```