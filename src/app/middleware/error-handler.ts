import { Request, Response, NextFunction } from 'express';

import Logger from '../../lib/logger';
import { UserAttributes } from '../models/user';

const logger = Logger.getInstance();

type RequestId = string;

/**
 * DO NOT REMOVE next function as this is required by Express to
 * treat this as a 'catch all' function
 * @param err Error thrown by some handler
 * @param req Express Request
 * @param res Express Response
 * @param next Express NextFunction
 * @returns
 */
export default function errorHandler(
  err: Error & { status?: number; message?: string; expose?: boolean },
  req: Request & { user?: UserAttributes; id?: RequestId },
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction,
) {
  const { path, user } = req;
  const handlerPath = '/' + path.split('/').slice(2).join('/');

  if (user) {
    logger.error(
      '[ID: %s | PATH: %s]: ERROR for user %s: %s',
      req.id ?? 'unknown',
      handlerPath,
      user.email,
      err.message,
    );
  } else {
    logger.error('[ID: %s | PATH: %s]: ERROR: %s', req.id ?? 'unknown', handlerPath, err.message);
  }

  if (res.headersSent) {
    return;
  }

  const status = err.status ?? 500;

  const message = err.expose ? err.message : 'Internal Server Error';

  return res.status(status).send({ error: message });
}
