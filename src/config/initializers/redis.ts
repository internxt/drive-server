import IORedis, { Redis as RedisInstance, RedisOptions } from 'ioredis';
import Logger from '../../lib/logger';

export default class Redis {
  private static instance: RedisInstance;
  private static readonly LOCK_EXPIRATION_IN_SECONDS = 30;

  constructor() {
    Redis.getInstance();
  }

  static getInstance(): RedisInstance {
    if (Redis.instance) {
      return Redis.instance;
    }

    const config: RedisOptions = {
      enableAutoPipelining: true,
      showFriendlyErrorStack: true,
    };

    const uri = process.env.REDIS_CONNECTION_STRING;

    if(!uri) {
      throw new Error('[CONFIG]: REDIS_CONNECTION_STRING is missing');
    }

    Redis.instance = new IORedis(uri, config);

    const logger = Logger.getInstance();

    Redis.instance.on('connect', () => logger.info('Connected to Redis'));
    Redis.instance.on('ready', () => logger.info('Redis is ready'));
    Redis.instance.on('error', (err) => logger.error('Redis error', err));
    Redis.instance.on('reconnecting', () => logger.info('Reconnecting to redis'));
    Redis.instance.on('close', () => logger.warn('Redis connection was closed'));

    return Redis.instance;
  }

  static async getUsage(userUuid: string): Promise<number | null> {
    const r = Redis.instance;

    const v = await r.get(`${userUuid}-usage`);

    if (!v) {
      return null;
    } 

    return (JSON.parse(v) as { usage: number }).usage;
  }

  static async getLimit(userUuid: string): Promise<{
    limit: number,
    cachedAt: number
  } | null> {
    const r = Redis.instance;

    const v = await r.get(`${userUuid}-limit`);

    if (!v) {
      return null;
    } 

    return (JSON.parse(v) as { limit: number, cachedAt: number });
  }

  static async setUsage(userUuid: string, usage: number): Promise<void> {
    const r = Redis.instance;

    await r.set(`${userUuid}-usage`, JSON.stringify({ usage }), 'EX', 10*60);
  }

  static async setLimit(userUuid: string, limit: number): Promise<void> {
    const r = Redis.instance;

    await r.set(`${userUuid}-limit`, JSON.stringify({ 
      limit,
      cachedAt: new Date().getTime()
    }), 'EX', 24*3600);
  }

  static async expireLimit(userUuid: string): Promise<void> {
    const r = Redis.instance;

    await r.del(`${userUuid}-limit`);
  }

  static async releaseLock(key: string) {
    const r = Redis.instance;

    const v = await r.get(key);

    if (v !== null) {
      return r.del(key);
    }
  }

  static async acquireOrRefreshLock(key: string, lock: string) {
    const r = Redis.instance;
    const value = await r.get(key);

    if (!value) {
      return r.set(key, lock, 'EX', Redis.LOCK_EXPIRATION_IN_SECONDS, 'NX');
    } else if (value === lock) {
      return r.expire(key, Redis.LOCK_EXPIRATION_IN_SECONDS);
    } else {
      return 0;
    }
  }
}
