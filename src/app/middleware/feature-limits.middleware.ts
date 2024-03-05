import { Request, Response, NextFunction } from 'express';
import { AuthorizedUser } from '../routes/types';
import { MissingValuesForFeatureLimit, NoLimitFoundForUserTierAndLabel } from '../services/errors/FeatureLimitsErrors';
import Logger from '../../lib/logger';

const logger = Logger.getInstance();

type User = AuthorizedUser['user'];
type Middleware = (req: Request & { behalfUser?: User }, res: Response, next: NextFunction) => Promise<void>;
type DataSource = { fieldName: string; sourceKey: string };
type BuilderArgs = {
  limitLabel: string;
  dataSources: DataSource[];
};

const LimitLabels = {
  MaxFileUploadSize: 'max-file-upload-size',
};

const build = (Service: {
  FeatureLimits: {
    shouldLimitBeEnforced: (user: User, limitLabel: string, data: any) => Promise<boolean>;
  };
}) => {
  const mdBuilder = ({ limitLabel, dataSources }: BuilderArgs) =>
    (async (req, res, next) => {
      try {
        const user = (req as any).behalfUser || (req as AuthorizedUser).user;

        if (!user || !user.tierId) {
          return next();
        }

        try {
          const extractedData = extractDataFromRequest(req, dataSources);
          const shouldLimitBeEnforced = await Service.FeatureLimits.shouldLimitBeEnforced(
            user,
            limitLabel,
            extractedData,
          );

          if (shouldLimitBeEnforced) {
            return res.status(402).send('You reached the limit for your tier!');
          }
        } catch (err) {
          if (err instanceof MissingValuesForFeatureLimit) {
            return res.status(400).send(err.message);
          }

          if (err instanceof NoLimitFoundForUserTierAndLabel) {
            logger.error('[FEATURE_LIMIT]: Error getting user limit, bypassing it userUuid: %s', user.uuid);
            next();
          }

          logger.error('[FEATURE_LIMIT]: Unexpected error ', err);
          return res.status(400).send('Internal Server error');
        }

        next();
      } catch (err) {
        next(err);
      }
    }) as Middleware;

  return {
    UploadFile: mdBuilder({
      limitLabel: LimitLabels.MaxFileUploadSize,
      dataSources: [{ sourceKey: 'body', fieldName: 'file' }],
    }),
  };
};

const extractDataFromRequest = (request: any, dataSources: DataSource[]) => {
  const extractedData = {} as any;
  for (const { sourceKey, fieldName } of dataSources) {
    const value = request[sourceKey][fieldName];
    if (value === null || value === undefined) {
      throw new MissingValuesForFeatureLimit(`Missing required value to check user limits, ${fieldName} is missing`);
    }
    extractedData[fieldName] = value;
  }
  return extractedData;
};

export { build, LimitLabels };
