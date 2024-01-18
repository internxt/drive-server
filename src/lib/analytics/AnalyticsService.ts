import Analytics from './Analytics';
import { getAppsumoAffiliate, getContext, getAffiliate } from './utils';
import { TrackName, User, ReqUser } from './types';

const logger = require('../../lib/logger').default;
const Logger = logger.getInstance();

// PROVISIONAL until express server typescript
import express from 'express';

const NETWORK_ANALYTICS_THRESHOLD = 6144;

export async function trackDeactivationRequest(uuid: string, req: express.Request) {
  const context = await getContext(req);
  Analytics.track({
    userId: uuid,
    event: TrackName.DeactivationRequest,
    context,
  });
}

export async function trackSignUp(req: express.Request, user: User) {
  const inxtClient = req.headers['internxt-client'];
  if(inxtClient === 'drive-web') {
    return;
  }
  const userId = user.uuid;
  const { sharedWorkspace, name, lastname } = user;

  const affiliate = getAppsumoAffiliate(user) || getAffiliate(req.headers.referrer);
  const context = await getContext(req);
  const location = context.location;

  Analytics.identify({
    userId,
    traits: {
      shared_workspace: sharedWorkspace,
      name,
      last_name: lastname,
      affiliate,
      usage: 0,
      ...affiliate,
      ...location,
    },
    context,
  });

  Analytics.track({
    userId,
    event: TrackName.SignUp,
    properties: {
      shared_workspace: sharedWorkspace,
      ...affiliate,
    },
    context,
  });
}


export async function trackSignUpAction(req: express.Request) {
  const { page, user } = req.body;
  const userId = user.uuid;
  const { sharedWorkspace, name, lastname } = user;

  const affiliate = getAppsumoAffiliate(user) || getAffiliate(req.headers.referrer);
  const appContext = await getContext(req);
  const context = { ...appContext, ...page.context };
  const location = context.location;

  Analytics.identify({
    userId,
    traits: {
      shared_workspace: sharedWorkspace,
      name,
      last_name: lastname,
      affiliate,
      usage: 0,
      ...affiliate,
      ...location,
    },
    context,
  });

  Analytics.track({
    userId,
    event: TrackName.SignUp,
    properties: {
      shared_workspace: sharedWorkspace,
      ...affiliate,
    },
    context,
  });
}

export async function trackInvitationSent(userId: string, inviteEmail: string) {
  Analytics.track({
    userId,
    event: TrackName.InvitationSent,
    properties: { sent_to: inviteEmail },
  });
}

export async function trackDeactivationConfirmed(userId: string) {
  Analytics.track({
    userId,
    event: TrackName.DeactivationConfirmed,
  });
}

export async function trackReferralRedeemed(userId: string, referralKey: string) {
  Analytics.track({
    userId,
    event: TrackName.ReferralRedeemed,
    properties: {
      name: referralKey,
    },
  });
}

export async function trackInvitationAccepted(userId: string, referredBy: string, sentBy: string) {
  Analytics.identify({
    userId,
    traits: { referred_by: referredBy },
  });
  Analytics.track({
    userId,
    event: TrackName.InvitationAccepted,
    properties: { sent_by: sentBy },
  });
}

export async function trackUploadCompleted(req: express.Request & ReqUser) {
  const { file } = req.body;
  if (file.size && file.size <= NETWORK_ANALYTICS_THRESHOLD) {
    return;
  }
  const { user } = req;
  const context = await getContext(req);

  Analytics.track({
    userId: user.uuid,
    event: TrackName.UploadCompleted,
    properties: {
      extension: file.type ? file.type.toLowerCase() : '',
      size: file.size,
    },
    context,
  });
}

export async function trackShareLinkCopied(userUuid: string, views: number, req: express.Request) {
  const context = await getContext(req);
  Analytics.track({
    userId: userUuid,
    event: TrackName.ShareLinkCopied,
    properties: {
      times_valid: views,
    },
    context,
  });
}

export async function trackFileDeleted(req: express.Request & ReqUser) {
  Logger.info(`User: ${JSON.stringify(req.body.user)}`);
  const context = await getContext(req);
  const { user, params } = req;

  Analytics.track({
    userId: user.uuid,
    event: TrackName.FileDeleted,
    properties: {
      file_id: params.fileid,
    },
    context,
  });
}

export async function trackSharedLink(req: express.Request, share: any) {
  const context = await getContext(req);
  const { userId, size, type } = share.fileMeta;
  const itemType = share.isFolder ? 'folder' : 'file';

  Analytics.track({
    userId,
    event: TrackName.SharedLinkItemDownloaded,
    properties: {
      owner: share.user,
      item_type: itemType,
      size,
      extension: type,
    },
    context,
  });
}

export async function trackFileDownloaded(req: express.Request) {
  const { properties, user } = req.body;
  const { size, type } = properties;
  if (!size || !type || size <= NETWORK_ANALYTICS_THRESHOLD) {
    return;
  }
  const context = await getContext(req);
  const userId = user.uuid;

  Analytics.track({
    userId,
    event: TrackName.DownloadCompleted,
    properties: {
      size,
      type: type.toLowerCase(),
    },
    context,
  });
}

export async function trackSignIn() {
  // TODO
}

export async function page(req: express.Request) {
  const appContext = getContext(req);
  const context = { ...appContext, ...req.body.page.context };
  Analytics.page({
    anonymousId: req.body.page.anonymousId,
    userId: req.body.page.userId,
    context,
    name: req.body.page.name,
    properties: req.body.page.properties,
  });
}

export async function trackSignupServerSide(req: express.Request) {
  const appContext = await getContext(req);
  const context = { ...appContext, ...req.body.page.context };
  const { properties, traits, userId } = req.body.track;
  Analytics.identify({
    userId,
    anonymousId: req.body.page.anonymousId,
    context,
    traits,
  });
  Analytics.track({
    userId,
    event: TrackName.SignUp,
    anonymousId: req.body.page.anonymousId,
    context,
    properties
  });

}

export const actions = {
  file_downloaded: trackFileDownloaded,
  user_signup: trackSignUpAction,
  server_signup: trackSignupServerSide
};
