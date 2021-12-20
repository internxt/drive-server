import Analytics from './Analytics';
import { getAppsumoAffiliate, getContext, getAffiliate } from './utils';
import { TrackName, User, ReqUser } from './types';
const logger = require('../../lib/logger').default;
const Logger = logger.getInstance();

// PROVISIONAL until express server typescript
import express from 'express';

const NETWORK_ANALYTICS_THRESHOLD = 6144;

export async function trackDeactivationRequest(req: express.Request & ReqUser) {
  const context = await getContext(req);
  const userId = req.user.uuid;
  Analytics.track({
    userId,
    event: TrackName.DeactivationRequest,
    context,
  });
}

export async function trackSignUp(req: express.Request, user: User) {
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
      extension: file.type.toLowerCase(),
      size: file.size,
    },
    context,
  });
}

export async function trackShareLinkCopied(req: express.Request & ReqUser) {
  const context = await getContext(req);
  const { user } = req;
  const { views } = req.body;

  Analytics.track({
    userId: user.uuid,
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

export const actions = {
  file_downloaded: trackFileDownloaded,
};
