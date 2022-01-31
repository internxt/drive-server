import { Request, Response, NextFunction } from 'express';
import { page as pageTracking } from '../../lib/analytics/AnalyticsService';

export function page(req: Request, res: Response, next: NextFunction) {
  pageTracking(req);
  next();
}