import { LockAction } from '../../../config/initializers/redis';

export class LockNotAvaliableError extends Error {
  constructor(folderId: number) {
    super(`Lock for ${folderId} is not avaliable`);

    Object.setPrototypeOf(this, LockNotAvaliableError.prototype);
  }
}

export class RedisCommandError extends Error {
  constructor({
    action,
    lock,
    folderId,
    userId,
  }: {
    action: LockAction;
    lock: string;
    folderId: number;
    userId: number;
  }) {
    super(`${action} lock ${lock} for folder:${folderId} and user ${userId} failed`);

    Object.setPrototypeOf(this, RedisCommandError.prototype);
  }
}
