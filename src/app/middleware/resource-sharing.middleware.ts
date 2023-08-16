import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

import { AuthorizedUser } from '../routes/types';
import { FolderAttributes } from '../models/folder';

type User = AuthorizedUser['user'];
type Middleware = (req: Request & { behalfUser?: User }, res: Response, next: NextFunction) => Promise<void>;

// This should match with the permissions table for the given user role.
enum Actions {
  UPLOAD_FILE = 'UPLOAD_FILE',
  SHARE_ITEMS = 'SHARE_ITEMS',
  RENAME_ITEMS = 'RENAME_ITEMS',
  DOWNLOAD_ITEMS = 'DOWNLOAD_ITEMS',
}

const build = (
  Service: {
    User: {
      FindUserByUuid: (uuid: string) => Promise<User | null>;
    },
    PrivateSharing: {
      CanUserPerformAction: (
        sharedWith: User,
        resourceId: FolderAttributes['uuid'],
        action: Actions,
      ) => Promise<boolean>;
    },
  },
) => {
  const mdBuilder = (action: Actions) => (async (req, res, next) => {
    try {
      const resourcesToken = req.headers['internxt-resources-token'];
      const { user: requester } = (req as AuthorizedUser);

      if (!resourcesToken || typeof resourcesToken !== 'string') {
        return next();
      }

      const decoded = jwt.verify(resourcesToken, process.env.JWT_SECRET as string) as {
        owner?: {
          uuid?: User['uuid'];
        };
        sharedRootFolderId?: FolderAttributes['uuid'];
      };

      if (!decoded.owner || !decoded.owner.uuid || !decoded.sharedRootFolderId) {
        return res.status(400).send('Unrecognized / Wrong token');
      }

      const userIsAllowedToPerfomAction = await Service.PrivateSharing.CanUserPerformAction(
        requester,
        decoded.sharedRootFolderId,
        action
      );

      if (!userIsAllowedToPerfomAction) {
        return res.status(403).send('User not allowed to perform action');
      }

      const resourceOwner = await Service.User.FindUserByUuid(decoded.owner.uuid);

      if (!resourceOwner) {
        return res.status(404).send('Resource owner not found');
      }

      req.behalfUser = resourceOwner;

      next();
    } catch (err) {
      next(err);
    }
  }) as Middleware;

  return {
    UploadFile: mdBuilder(Actions.UPLOAD_FILE),
    UploadThumbnail: mdBuilder(Actions.UPLOAD_FILE),
    ShareItem: mdBuilder(Actions.SHARE_ITEMS),
    RenameFile: mdBuilder(Actions.RENAME_ITEMS),
    DownloadFile: mdBuilder(Actions.DOWNLOAD_ITEMS),
  };
};

export {
  build,
};
