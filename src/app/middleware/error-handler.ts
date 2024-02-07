import { Request, Response, NextFunction } from 'express';

import { UserAttributes } from '../models/user';

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
  req: Request & { user?: UserAttributes; id?: RequestId; logger?: any },
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction,
) {
  const { path, user } = req;
  const handlerPath = '/' + path.split('/').slice(2).join('/');

  if (err.status !== 401) {
    if (user) {
      req.logger?.error(
        '%s ERROR for user %s: %s Stack: %s. Payload %s', 
        handlerPath, 
        user.email, 
        err.message, 
        err.stack, 
        req.body ? JSON.stringify(req.body) : 'NO PAYLOAD'
      );
    } else {
      req.logger?.error('%s ERROR %s Stack: %s', handlerPath, err.message, err.stack);
    }
  }

  if (res.headersSent) {
    return;
  }

  const status = err.status ?? 500;

  const message = err.expose ? err.message : 'Internal Server Error';

  return res.status(status).send({ error: message });
}
