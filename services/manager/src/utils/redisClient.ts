import Redis from 'ioredis';

const redisClient = new Redis({
  host: process.env.HOST || 'redis',
  port: Number(process.env.REDIS_PORT) || 6379,
});

export default redisClient;
