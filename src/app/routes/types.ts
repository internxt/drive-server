import { Request } from 'express';
import { UserAttributes } from '../models/user';

export type AuthorizedUser = Request & { user: UserAttributes };
