import IORedis, { Redis as Rediss, RedisOptions } from 'ioredis';
import Logger from '../../lib/logger';

export default class Redis {
  private static instance: Rediss;
  private static readonly LOCK_EXPIRATION_IN_SECONDS = 30;

  constructor() {
    Redis.getInstance();
  }

  static getInstance(): Rediss {
    if (Redis.instance) {
      return Redis.instance;
    }

    const config: RedisOptions = {
      enableAutoPipelining: true,
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
