import IORedis from 'ioredis';
import { env } from './env';

export const redisConnection = new IORedis({
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    maxRetriesPerRequest: null, // Required by BullMQ
});

redisConnection.on('error', (err) => {
    console.error('[Redis] Connection Error:', err.message);
});

redisConnection.on('connect', () => {
    console.log('[Redis] Connected successfully');
});
