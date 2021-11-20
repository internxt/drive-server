import { Request, Response, NextFunction } from 'express';

import Logger from '../../lib/logger';
import { UserAttributes } from '../models/user';

const logger = Logger.getInstance();

/**
 * DO NOT REMOVE next function as this is required by Express to 
 * treat this as a 'catch all' function
 * @param err Error thrown by some handler
 * @param req Express Request
 * @param res Express Response
 * @param next Express NextFunction
 * @returns
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function errorHandler(err: Error, req: Request & { user?: UserAttributes }, res: Response, next: NextFunction) {
  const { path, user } = req;
  const handlerPath = '/' + path.split('/').slice(2).join('/');

  if (user) {
    logger.error('[%s]: ERROR for user %s: %s', handlerPath, user.email, err.message);
  } else {
    logger.error('[%s]: ERROR: %s', handlerPath, err.message);
  }

  if(res.headersSent) {
    return;
  }

  return res.status(500).send({ error: 'Internal Server Error' });
}
